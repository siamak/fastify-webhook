import superagent from "superagent";
import { LinearClient } from "bybit-api";
import _fastify from "fastify";
// import dotenv from "dotenv";
// dotenv.config();
const fastify = _fastify({ logger: true });

const TELEGRAM_BOT = "1963096824:AAFIlbQieRRLu1G-Nk6466LV5h-fxsrrFO8";
const TELEGRAM_CHAT_ID = "40554797";
const CONSTANTS = {
	Buy: {
		sl: 0.75 * 0.01,
		tp: 1.25 * 0.01,
	},
	Sell: {
		sl: 0.75 * 0.01,
		tp: 1.25 * 0.01,
	},
};
global.currentQty = 0;

const client = new LinearClient("XVXIx3n7hoFifCtK9C", "7X2LZMAYnDSJhmusok13GO8Y3tWn8UhP9sP7", true);

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
	const { strategy, comment, exchange: _ecx, ticker } = req.body;
	const side = capitalizeFirstLetter(strategy.order_action);
	const qty = Number(strategy.order_contracts);
	const closeTrade = comment.includes("Close");
	const preOrder = {
		symbol,
		side,
		qty,
		order_type: "Market",
		time_in_force: "GoodTillCancel",
		reduce_only: false,
		close_on_trigger: false,
	};

	let order;
	let extraMsg = "";

	try {
		if (closeTrade) {
			// global.currentQty
			// global.currentQty = 0;
			// preOrder.reduce_only = true;
			// // preOrder.order_type = "Market
			// preOrder.close_on_trigger = true;
			// order = await client.placeActiveOrder(preOrder);
		} else {
			const entryPrice = Number(strategy.order_price);
			const { sl, tp } = CONSTANTS[side];

			if (global.currentQty) {
				const remained = qty - global.currentQty;
				console.log("Still has qty", global.currentQty, remained);

				await client.placeActiveOrder({
					symbol,
					side: side === "Buy" ? "Sell" : "Buy",
					order_type: "Market",
					qty: remained,
					time_in_force: "GoodTillCancel",
				});

				extraMsg += `\nClose remained ${remained}`;

				console.log("Close remained", remained);
			}

			// preOrder.stop_loss = (Math.floor(entryPrice * sl * 100) / 100).toFixed(2) * 1;
			// preOrder.take_profit = (Math.round(entryPrice * tp * 100) / 100).toFixed(2) * 1;

			const op = side === "Buy";
			preOrder.stop_loss = entryPrice * (op ? 1 - sl : 1 + sl);
			preOrder.take_profit = entryPrice * (op ? 1 + tp : 1 - tp);
			// preOrder.order_type = "Market"; // Entr to trade with Market
			order = await client.placeActiveOrder(preOrder);

			extraMsg += `\n💚 Take Profit: *${preOrder.take_profit}* \n\n💔 Stop Loss: *${preOrder.stop_loss}*`;

			global.currentQty = qty;
		}

		await sendMessage(
			`
🌕 *${ticker}*

${strategy.order_action === "buy" ? "❇️ Long" : "🔴 Short"}

💰 Enter price: *${strategy.order_price}*
${extraMsg}

🧮 Qty: *${strategy.order_contracts}*

🗒 Comment: ${comment}

*${_ecx}*`
		);

		// if (extraMsg !== "") {
		// 	await sendMessage(extraMsg);
		// }

		res.code(200).header("Content-Type", "application/json; charset=utf-8").send({ order });
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
		await fastify.listen(5900);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};
start();
