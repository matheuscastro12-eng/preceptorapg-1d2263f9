import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      // Use constructEventAsync instead of constructEvent for Deno compatibility
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      logStep("Event verified with webhook secret", { type: event.type });
    } else {
      event = JSON.parse(body);
      logStep("Event parsed without verification", { type: event.type });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    logStep("Processing webhook event", { type: event.type });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const planType = session.metadata?.plan_type;

        logStep("Checkout completed", { userId, planType, customerId: session.customer, subscriptionId: session.subscription });

        if (userId) {
          const subscriptionData = {
            status: "active",
            plan_type: planType || "monthly",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          };

          // Check if subscription exists
          const { data: existing } = await supabaseAdmin
            .from("subscriptions")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();

          if (existing) {
            const { error } = await supabaseAdmin
              .from("subscriptions")
              .update(subscriptionData)
              .eq("user_id", userId);
            logStep("Updated existing subscription", { error: error?.message });
          } else {
            const { error } = await supabaseAdmin
              .from("subscriptions")
              .insert({ user_id: userId, ...subscriptionData });
            logStep("Inserted new subscription", { error: error?.message });
          }

          // Also set current_period_end from the Stripe subscription
          if (session.subscription) {
            try {
              const sub = await stripe.subscriptions.retrieve(session.subscription as string);
              await supabaseAdmin
                .from("subscriptions")
                .update({
                  current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
                })
                .eq("user_id", userId);
              logStep("Updated period end", { end: new Date(sub.current_period_end * 1000).toISOString() });
            } catch (e) {
              logStep("Failed to get subscription details", { error: e.message });
            }
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const status = subscription.status === "active" ? "active" : "inactive";

        logStep("Subscription status change", { subscriptionId: subscription.id, status });

        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update({
            status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);
        
        logStep("Updated subscription status", { error: error?.message });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const { error } = await supabaseAdmin
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_subscription_id", invoice.subscription as string);
          logStep("Marked subscription as past_due", { error: error?.message });
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
