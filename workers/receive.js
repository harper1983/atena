const url = process.env.CLOUDAMQP_URL;
const queue = process.env.CLOUDMQP_QUEUE;

const bail = err => {
  console.error(err);
  process.exit(1);
};

const consumer = conn => {
  const on_open = (err, ch) => {
    if (err != null) bail(err);

    ch.assertQueue(queue);
    ch.consume(queue, msg => {
      console.log("--- tá consumindo");
      console.log(msg.toString());
      if (msg !== null) {
        console.log(msg.content.toString());
        ch.ack(msg);
      }
    });
  };

  conn.createChannel(on_open);
};

const run = () => {
  require("amqplib/callback_api").connect(url, (err, conn) => {
    if (err != null) bail(err);
    consumer(conn);
  });
};

run();
