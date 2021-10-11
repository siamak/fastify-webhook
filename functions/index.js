import superagent from "superagent";
import { LinearClient } from "bybit-api";
import dotenv from "dotenv";
import _fastify from "fastify";
import { createHmac } from "crypto";
// import { any } from "./interface";

const fastify = _fastify({ logger: true });
dotenv.config();

const { API_KEY, PRIVATE_KEY, TELEGRAM_BOT, TELEGRAM_CHAT_ID } = process.env;

const useLivenet = true;

const client = new LinearClient(
	"XVXIx3n7hoFifCtK9C",
	"7X2LZMAYnDSJhmusok13GO8Y3tWn8UhP9sP7",

	// optional, uses testnet by default. Set to 'true' to use livenet.
	useLivenet

	// restClientOptions,
	// requestLibraryOptions
);

async function sendMessage(text) {
	const opts = {
		url: `https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`,
		body: {
			chat_id: TELEGRAM_CHAT_ID,
			text,
			parse_mode: "markdown",
		},
		headers: {
			"Content-Type": "application/json",
		},
	};

	const res = await superagent.post(opts.url).send(opts.body);

	return res;
}

function capitalizeFirstLetter(string) {
	return string[0].toUpperCase() + string.slice(1);
}

fastify.post("/bybit", async (req, res) => {
	const { symbol } = req.query;
	const { strategy, comment, exchange: _ecx } = req.body;
	const side = capitalizeFirstLetter(strategy.order_action);
	const qty = Number(strategy.order_contracts);
	const reduceOnly = comment.includes("Close");

	console.log({ symbol });
	try {
		const order = await client.placeActiveOrder({
			symbol,
			side,
			order_type: "Limit",
			qty: 1,
			price: 100,
			reduce_only: false,
			close_on_trigger: false,
			time_in_force: "GoodTillCancel",
		});
		// const order = await exchange.fetchBalance({ type: "futures", currency: "USDT" });
		// const order = await exchange.createOrder(symbol, "limit", side as any, qty, 0, {
		// 	reduce_only: reduceOnly,
		// 	time_in_force: "GoodTillCancel",
		// });

		console.log(123, { order });

		// await sendMessage(`*${symbol}*\n${comment}\n*${qty}* — ${side}`);
		// await sendMessage(`✅ Took on *${_ecx}* — *${side}* — *${symbol}* – QTY: *${qty}*`);

		res.code(200).header("Content-Type", "application/json; charset=utf-8").send(order);
	} catch (error) {
		console.dir(error);
		await sendMessage(error.message);
		res.status(400).send(error);
	}
});

fastify.get("/ping", async (req, res) => {
	res.status(200).send({
		message: "pong",
	});
});

// export default async function (instance: FastifyInstance, opts: FastifyServerOptions, done: any) {
// 	instance.post("/bybit", async (req: FastifyRequest<any>, res: FastifyReply) => {
// 		const { symbol } = req.query;
// 		const { strategy, comment, exchange: _ecx } = req.body;
// 		const side = capitalizeFirstLetter(strategy.order_action);
// 		const qty = Number(strategy.order_contracts);
// 		const reduceOnly = comment.includes("Close");

// 		try {
// 			const order = await exchange.createOrder(symbol, "Market", side as any, qty, 0, {
// 				reduce_only: reduceOnly,
// 				time_in_force: "GoodTillCancel",
// 			});

// 			console.log(order);

// 			await sendMessage(`*${symbol}*\n${comment}\n*${qty}* — ${side}`);
// 			await sendMessage(`✅ Took on *${_ecx}* — *${side}* — *${symbol}* – QTY: *${qty}*`);

// 			res.code(200).header("Content-Type", "application/json; charset=utf-8").send(order);
// 		} catch (error: any) {
// 			console.log(error);
// 			await sendMessage(error.message);
// 			res.status(400).send(error);
// 		}
// 	});

// 	instance.get("/ping", async (req: FastifyRequest<any>, res: FastifyReply) => {
// 		res.status(200).send({
// 			message: "pong",
// 		});
// 	});

// 	instance.post("/print", async (req: FastifyRequest<any>, res: FastifyReply) => {
// 		const { symbol } = req.query;
// 		const { strategy, comment, exchange: _ecx } = req.body;
// 		const side = capitalizeFirstLetter(strategy.order_action);
// 		const qty = Number(strategy.order_contracts);
// 		const reduceOnly = comment.includes("Close");

// 		await sendMessage(`${JSON.stringify({ strategy, comment, _ecx, symbol, side, reduceOnly }, null, 2)}`);
// 		res.status(200).send({
// 			message: "Print",
// 		});
// 	});

// 	done();
// }

const start = async () => {
	try {
		await fastify.listen(3000);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};
start();
