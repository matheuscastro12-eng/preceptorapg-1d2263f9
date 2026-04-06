// EasyFlow Webhook — handles Order, Subscription, Payment events
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const rawBody = await req.text();
    let body: Record<string, any> = {};
    try { body = JSON.parse(rawBody); } catch {
      try { const p = new URLSearchParams(rawBody); p.forEach((v, k) => { try { body[k] = JSON.parse(v); } catch { body[k] = v; } }); }
      catch { body = { raw: rawBody }; }
    }

    const event = (body.event || "").toLowerCase();
    const payload = body.payload || body;

    console.log(`[EasyFlow] Event: ${event}`);

    // Save raw event for audit
    try {
      await supabase.from("webhook_events").insert({ provider: "easyflow", event_type: event || "unknown", payload: body });
    } catch {}

    // ── Extract email (different locations for Order vs Subscription) ──
    // Order events: payload.buyer.email
    // Subscription events: payload.customer.email
    const email = (
      payload.buyer?.email ||
      payload.customer?.email ||
      payload.email ||
      ""
    ).toLowerCase().trim();

    if (!email) {
      console.log("[EasyFlow] No email found, skipping");
      return json({ received: true, action: "skipped_no_email" });
    }

    // ── Detect plan from subscription periodicity or product name ──
    const detectPlan = (): string => {
      // Subscription events have periodicity
      const period = (payload.periodicity || "").toLowerCase();
      if (period === "annualy" || period === "annually" || period === "yearly") return "annual";
      if (period === "biannualy" || period === "biannually") return "biannual";
      if (period === "monthly") return "monthly";
      if (period === "quarterly") return "quarterly";

      // Order events — check product name in items
      const productName = (payload.items?.[0]?.product?.name || payload.items?.[0]?.offer?.name || payload.name || "").toLowerCase();
      if (productName.includes("bianual") || productName.includes("2 ano")) return "biannual";
      if (productName.includes("anual") || productName.includes("annual") || productName.includes("1 ano")) return "annual";
      return "monthly";
    };

    // ── Find user by email ──
    const findUser = async () => {
      const { data } = await supabase.from("profiles").select("user_id").eq("email", email).maybeSingle();
      return data;
    };

    // ══════════════════════════════════════════════
    // ACTIVATION EVENTS (payment/subscription confirmed)
    // ══════════════════════════════════════════════
    if (
      event === "order.paid" ||
      event === "payment.paid" ||
      event === "subscription.activated" ||
      event === "subscription.created" ||
      event === "subscriptionrecurrence.paid"
    ) {
      const profile = await findUser();
      if (!profile) {
        console.log(`[EasyFlow] User not found: ${email}`);
        return json({ received: true, action: "user_not_found", email });
      }

      const plan = detectPlan();

      // Upsert subscription
      const { data: existing } = await supabase
        .from("subscriptions").select("id").eq("user_id", profile.user_id).maybeSingle();

      const subData = {
        status: "active" as const,
        plan_type: plan,
        stripe_customer_id: payload.id || payload.buyer?.id || payload.customer?.id || null,
        stripe_subscription_id: payload.payments?.[0]?.id || payload.id || null,
      };

      if (existing) {
        await supabase.from("subscriptions").update(subData).eq("user_id", profile.user_id);
      } else {
        await supabase.from("subscriptions").insert({ user_id: profile.user_id, ...subData });
      }

      // Update CRM lead
      await supabase.from("crm_leads")
        .update({ status: "subscriber", converted_at: new Date().toISOString() })
        .eq("user_id", profile.user_id);

      console.log(`[EasyFlow] ✅ Activated: ${email} -> ${plan}`);
      return json({ received: true, action: "activated", email, plan });
    }

    // ══════════════════════════════════════════════
    // CANCELLATION / EXPIRATION EVENTS
    // ══════════════════════════════════════════════
    if (
      event === "order.canceled" ||
      event === "order.refunded" ||
      event === "payment.canceled" ||
      event === "payment.refunded" ||
      event === "payment.chargeback" ||
      event === "subscription.canceled" ||
      event === "subscription.expired" ||
      event === "subscription.inactivated" ||
      event === "subscriptionrecurrence.canceled"
    ) {
      const profile = await findUser();
      if (profile) {
        await supabase.from("subscriptions")
          .update({ status: "inactive", plan_type: "none" })
          .eq("user_id", profile.user_id);

        await supabase.from("crm_leads")
          .update({ status: "churned", churned_at: new Date().toISOString() })
          .eq("user_id", profile.user_id);

        console.log(`[EasyFlow] ❌ Cancelled/Expired: ${email}`);
      }
      return json({ received: true, action: "cancelled", email });
    }

    // ══════════════════════════════════════════════
    // PAYMENT ISSUES (delayed/failed — don't cancel yet)
    // ══════════════════════════════════════════════
    if (
      event === "subscriptionrecurrence.delayed" ||
      event === "subscriptionrecurrence.failed"
    ) {
      const profile = await findUser();
      if (profile) {
        // Mark as inadimplente but keep plan_type
        await supabase.from("subscriptions")
          .update({ status: "inactive" })
          .eq("user_id", profile.user_id);

        console.log(`[EasyFlow] ⚠️ Payment issue: ${email} (${event})`);
      }
      return json({ received: true, action: "payment_issue", email, event });
    }

    // ══════════════════════════════════════════════
    // UPDATES / OTHER EVENTS
    // ══════════════════════════════════════════════
    if (event === "order.updated" || event === "subscription.updated") {
      console.log(`[EasyFlow] ℹ️ Update event: ${event} for ${email}`);
      return json({ received: true, action: "updated", email, event });
    }

    console.log(`[EasyFlow] Unhandled: ${event}`);
    return json({ received: true, action: "unhandled", event });

  } catch (err) {
    console.error("[EasyFlow Error]", (err as Error).message);
    return json({ error: (err as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
