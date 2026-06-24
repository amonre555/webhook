import express from "express";
import crypto from "crypto";

const app = express();
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
    throw new Error("WEBHOOK_SECRET environment variable is not defined");
}

const processedEvents = new Map<string, WebhookEvent>();
const deadEvents = new Map<string, WebhookEvent>();

type WebhookEvent = {
    id: string;
    type: string;
    data: {
        orderId: string;
        amount: number;
        email: string;
    }
}

type QueueItem = {
    event: WebhookEvent;
    retries: number;
};

const queue: QueueItem[] = [];
const deadLetterQueue: QueueItem[] = [];

app.use(express.json({
    verify: (req: any, res: any, buf: any) => {
        req.rawBody = buf.toString();
    }
}))

const computeSignature = (payload: string) => {
    return crypto
        .createHmac("sha256", WEBHOOK_SECRET)
        .update(payload)
        .digest("hex");
}

const verifySignature = (req: any): boolean => {
    const signature = req.header("x-webhook-signature");
    if (!signature) return false;
    
    const computedSignature = computeSignature(req.rawBody);
    return signature === computedSignature;
}

const processPaymentEvent = (event: WebhookEvent) => {
    processedEvents.set(event.id, event);
}

let isProcessingQueue = false;

const processQueue = async () => {
    if (isProcessingQueue) return;
    isProcessingQueue = true;

    while (queue.length > 0) {
        const item = queue.shift();
        if (!item) continue;
        
        const { event, retries } = item;

        if (processedEvents.has(event.id)) {
            console.log(`[Queue] L'événement ${event.id} a déjà été traité. Ignoré.`);
            continue;
        }

        try {
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (event.data && event.data.amount < 0) {
                        reject(new Error("Simulation d'erreur : montant négatif !"));
                    } else {
                        resolve(true);
                    }
                }, 100);
            });
            
            processPaymentEvent(event);
            console.log(`[Queue] Événement traité avec succès : ${event.id}`);
        } catch (error) {
            console.error(`[Queue] Erreur lors du traitement de l'événement ${event.id}:`, error);
            
            if (retries < 3) {
                console.log(`[Queue] Nouvelle tentative pour ${event.id} (Essai ${retries + 1}/3)`);
                queue.push({ event, retries: retries + 1 });
            } else {
                console.error(`[Queue] L'événement ${event.id} a échoué après 3 tentatives. Ajout à la Dead Letter Queue.`);
                deadLetterQueue.push({ event, retries });
                deadEvents.set(event.id, event);
            }
        }
    }

    isProcessingQueue = false;
}

setInterval(processQueue, 5000);

app.post("/webhook/payment", async (req, res) => {
    const content = req.body;
    
    if (!verifySignature(req)) {
        res.status(401).send("Invalid signature");
        return;
    }

    if (processedEvents.has(content.id)) {
        res.status(400).send("Event already processed");
        return;
    }

    if (deadEvents.has(content.id)) {
        res.status(400).send("Event is dead (failed 3 times)");
        return;
    }

    queue.push({ event: content, retries: 0 });

    res.status(200).send("ok");
})



app.get("/events", (req, res) => {
    res.status(200).json({
        pending: queue.map(q => q.event),
        processed: Array.from(processedEvents.values()),
        dead: Array.from(deadEvents.values())
    });
})

app.listen(3000, () => {
    console.log("Server is running on port 3000");
})