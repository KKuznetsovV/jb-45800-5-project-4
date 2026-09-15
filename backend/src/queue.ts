import amqp, { type Channel } from "amqplib";

const QUEUE_NAME = process.env.QUEUE_NAME || "predictions";

let channel: Channel;

export async function waitForQueue(): Promise<void> {
  for (;;) {
    try {
      const connection = await amqp.connect(
        process.env.RABBITMQ_URL || "amqp://guest:guest@127.0.0.1:5672"
      );
      channel = await connection.createChannel();
      await channel.assertQueue(QUEUE_NAME, { durable: true });
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

export async function publishPrediction(id: number): Promise<void> {
  channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify({ id })), {
    persistent: true,
  });
}
