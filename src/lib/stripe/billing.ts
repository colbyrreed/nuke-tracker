// src/lib/stripe/billing.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function createBillingPortalSession(customerId: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    configuration: await getPortalConfiguration(),
  })
  return session.url
}

async function getPortalConfiguration(): Promise<string | undefined> {
  // Try to find an existing configuration
  try {
    const configs = await stripe.billingPortal.configurations.list({ limit: 1, active: true })
    if (configs.data.length > 0) return configs.data[0].id
  } catch {}

  // Create one if none exists
  const config = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: 'Manage your Nuke Tracker subscription',
      privacy_policy_url: `${process.env.NEXT_PUBLIC_APP_URL}/privacy`,
      terms_of_service_url: `${process.env.NEXT_PUBLIC_APP_URL}/terms`,
    },
    features: {
      subscription_cancel: {
        enabled: true,
        mode: 'at_period_end',
        cancellation_reason: {
          enabled: true,
          options: ['too_expensive', 'missing_features', 'switched_service', 'unused', 'other'],
        },
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ['price'],
        proration_behavior: 'create_prorations',
        products: [
          {
            product: process.env.STRIPE_PRO_PRODUCT_ID!,
            prices: [process.env.STRIPE_PRO_PRICE_ID!],
          },
          {
            product: process.env.STRIPE_ELITE_PRODUCT_ID!,
            prices: [process.env.STRIPE_ELITE_PRICE_ID!],
          },
        ],
      },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
    },
  })

  return config.id
}

export async function getSubscriptionDetails(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
    expand: ['data.default_payment_method', 'data.items.data.price'],
  })

  const sub = subscriptions.data[0]
  if (!sub) return null

  const price = sub.items.data[0]?.price
  const paymentMethod = sub.default_payment_method as Stripe.PaymentMethod | null

  return {
    id: sub.id,
    status: sub.status,
    currentPeriodEnd: new Date(sub.current_period_end * 1000),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    priceId: price?.id,
    amount: price?.unit_amount ? price.unit_amount / 100 : 0,
    interval: price?.recurring?.interval ?? 'month',
    currency: price?.currency ?? 'usd',
    paymentMethod: paymentMethod
      ? {
          brand: paymentMethod.card?.brand ?? 'unknown',
          last4: paymentMethod.card?.last4 ?? '****',
          expMonth: paymentMethod.card?.exp_month,
          expYear: paymentMethod.card?.exp_year,
        }
      : null,
  }
}

export async function getInvoiceHistory(customerId: string, limit = 10) {
  const invoices = await stripe.invoices.list({ customer: customerId, limit })
  return invoices.data.map((inv) => ({
    id: inv.id,
    number: inv.number,
    amount: (inv.amount_paid ?? 0) / 100,
    currency: inv.currency,
    status: inv.status,
    date: new Date((inv.created ?? 0) * 1000),
    pdf: inv.invoice_pdf,
    periodStart: inv.period_start ? new Date(inv.period_start * 1000) : null,
    periodEnd: inv.period_end ? new Date(inv.period_end * 1000) : null,
  }))
}
