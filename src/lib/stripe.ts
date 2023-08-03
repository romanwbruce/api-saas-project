import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';

import { PrismaClient } from "@prisma/client";
import { randomUUID } from 'crypto';
const prisma = new PrismaClient();

//price_1NarR3APMZcBliJSoefCKTi5

export const stripe = new Stripe(String(process.env.STRIPE_SECRET), {
    apiVersion: '2022-11-15',
});

export async function hasSubscription() {
    const session = await getServerSession(authOptions);

    if (session) {
        const user = await prisma.user.findFirst({ where: { email: session.user?.email } });

        const subscriptions = await stripe.subscriptions.list({
            customer: String(user?.stripe_customer_id)
        })

        return subscriptions.data.length > 0;
    }

    return false;
}

export async function createCheckoutLink(customer: string) {
    const checkout = await stripe.checkout.sessions.create({
        success_url: "http://localhost:3000/dashboard/billing?success=true",
        cancel_url: "http://localhost:3000/dashboard/billing?success=true",
        customer: customer,
        line_items: [
            {
                price: 'price_1NarR3APMZcBliJSoefCKTi5'
            }
        ],
        mode: "subscription"
    })

    return checkout.url;
}

export async function createCustomerIfNull() {
    const session = await getServerSession(authOptions);

    if (session) {
        const user = await prisma.user.findFirst({ where: { email: session.user?.email } });

        if (!user?.api_key) {
            await prisma.user.update({
                where: {
                    id: user?.id
                },
                data: {
                    api_key: "secret_" + randomUUID()
                }
            })
        }
        if (!user?.stripe_customer_id) {
            const customer = await stripe.customers.create({
                email: String(user?.email)
            })

            await prisma.user.update({
                where: {
                    id: user?.id
                },
                data: {
                    stripe_customer_id: customer.id
                }
            })
        }
        const user2 = await prisma.user.findFirst({ where: { email: session.user?.email } });
        return user2?.stripe_customer_id;
    }

}