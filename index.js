const fastify = require("fastify")({
	logger: {
		level: "info",
	},
});
require("dotenv").config();
const ccxt = require("ccxt");
const get = require("simple-get");

const { API_KEY, PRIVATE_KEY, TELEGRAM_BOT, TELEGRAM_CHAT_ID } = process.env;

function sendMessage(text) {
	const opts = {
		url: `https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`,
		method: "POST",
		body: JSON.stringify({
			chat_id: TELEGRAM_CHAT_ID,
			text,
			parse_mode: "markdown",
		}),
		headers: {
			"Content-Type": "application/json",
		},
	};
	get(opts, function (err, res) {
		if (err) throw err;
		// console.log(res);
	});
}

console.log({ API_KEY, PRIVATE_KEY });

const exchange = new ccxt.bybit({
	apiKey: API_KEY,
	secret: PRIVATE_KEY,
	enableRateLimit: true,
});
exchange.setSandboxMode(true);

function capitalizeFirstLetter(string) {
	return string[0].toUpperCase() + string.slice(1);
}

fastify.post("/bybit", async (request, reply) => {
	const { symbol } = request.query;
	const { strategy, comment, exchange: _ecx } = request.body;
	const side = capitalizeFirstLetter(strategy.order_action);
	const qty = Number(strategy.order_contracts);
	const reduceOnly = comment.includes("Close");

	try {
		const order = await exchange.createOrder(symbol, "Market", side, qty, 0, {
			reduce_only: reduceOnly,
			time_in_force: "GoodTillCancel",
		});

		console.log(order);

		sendMessage(`*${symbol}*\n${comment}\n*${qty}* — ${side}`);
		sendMessage(`✅ Took on *${_ecx}* — *${side}* — *${symbol}* – QTY: *${qty}*`);

		reply.code(200).header("Content-Type", "application/json; charset=utf-8").send(order);
	} catch (error) {
		sendMessage(error.message);
		reply.status(400).send(error);
	}
});

const start = async () => {
	try {
		await fastify.listen(5000);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};

start();
