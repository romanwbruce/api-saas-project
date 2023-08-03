import { NextApiRequest, NextApiResponse } from "next";

import { PrismaClient } from "@prisma/client";
import { stripe } from "@/lib/stripe";
import { randomUUID } from "crypto";
const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    const { api_key } = req.query;

    if (!api_key) {
        res.status(401).json({
            error: "Must have a valid api key!"
        })
    }

    const user = await prisma.user.findFirst({
        where: {
            api_key: String(api_key)
        }
    })

    if (!user) {
        res.status(401).json({
            error: "There is no user with such api key!"
        })
    }

    const customer = await stripe.customers.retrieve(String(user?.stripe_customer_id));

    const subscriptions = await stripe.subscriptions.list({
        customer: String(user?.stripe_customer_id)
    })

    const item = subscriptions.data.at(0)?.items.data.at(0);

    if (!item) {
        res.status(403).json({
            error: "You have no subscription."
        })
    }

    await stripe.subscriptionItems.createUsageRecord(String(item?.id),
        {
            quantity: 1
        })


    const data = randomUUID();

    const log = await prisma.log.create({
        data: {
            userId: String(user?.id),
            status: 200,
            method: "GET",
        }
    })

    res.status(200).json({
        status: true,
        special_key: data,
        log: log
    })
}