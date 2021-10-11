import { FastifyInstance, FastifyReply, FastifyRequest, FastifyServerOptions } from "fastify";
import { LinearClient } from "bybit-api";
import api from "kucoin-futures-node-api";
import superagent from "superagent";
import dotenv from "dotenv";
import { RouteGenericQuery } from "./interface";

dotenv.config();

const { API_KEY, PRIVATE_KEY, TELEGRAM_BOT, TELEGRAM_CHAT_ID } = process.env;

async function sendMessage(text: string) {
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

const config = {
	apiKey: "6163336d1392350001ab60d7",
	secretKey: "a7c95c73-9ea0-4bf1-9d4e-1d7aac3c59f9",
	passphrase: "77430137",
	environment: "live",
};

const apiLive = new api();
apiLive.init(config);

const useLivenet = true;

const client = new LinearClient(
	"XVXIx3n7hoFifCtK9C",
	"7X2LZMAYnDSJhmusok13GO8Y3tWn8UhP9sP7",

	// optional, uses testnet by default. Set to 'true' to use livenet.
	useLivenet

	// restClientOptions,
	// requestLibraryOptions
);

function capitalizeFirstLetter(string: string) {
	return string[0].toUpperCase() + string.slice(1);
}

export default async function (instance: FastifyInstance, opts: FastifyServerOptions, done: any) {
	instance.post("/kucoin", async (req: FastifyRequest<RouteGenericQuery>, res: FastifyReply) => {
		const { symbol } = req.query;
		const { strategy, comment, exchange: _ecx, ticker } = req.body;
		const side = capitalizeFirstLetter(strategy.order_action);
		const qty = strategy.order_contracts;
		// const isClose = comment.includes("Close");

		try {
			// const order = await apiLive.getAccountOverview({
			// 	currency: "USDT",
			// });

			const preOrder: any = {
				clientOid: "e049b283-8f08-413f-bfa7-b96281d7e4f1",
				side,
				symbol,
				type: "market",
				leverage: "5",
				size: qty,
				// price: 100,
				// reduceOnly,
			};

			// if (isClose) {
			// 	preOrder.type = "limit";
			// 	preOrder.price = strategy.order_price;
			// }

			// AXSUSDTM
			// https://github.com/mickomagallanes/kucoin-futures-node-api#trade-endpoints-private
			const order = await apiLive.placeOrder(preOrder);
			// const order = await apiLive.getContract("AXSUSDTM");
			// const order = await exchange.loadMarkets();
			// const order = await exchange.loadMarkets();
			// const order = await exchange.fetchBalance({ type: "futures", currency: "USDT" });
			// const order = await exchange.createOrder(symbol, "limit", side, qty, 3000);

			// const order = await exchange.createOrder(symbol, "limit", side as any, qty, 0, {
			// 	reduce_only: reduceOnly,
			// 	time_in_force: "GoodTillCancel",
			// });

			console.log(order);

			// await sendMessage(`*${symbol}*\n${comment}\n*${qty}* — ${side}`);

			if (order && order?.code === "200000") {
				await sendMessage(
					`
🌕 *${ticker}*

${strategy.order_action === "buy" ? "❇️ Long" : "🔴 Short"}

💰 Enter price: *${strategy.order_price}*

🧮 Qty: *${strategy.order_contracts}*

🗒 Comment: *${comment}* — 123

[*${_ecx}*]`
				);
			} else {
				await sendMessage(`[Kucoin]: ${order?.msg}`);
			}

			res.code(200).header("Content-Type", "application/json; charset=utf-8").send(order);
		} catch (error: any) {
			console.dir(error);
			await sendMessage(error.message);
			res.status(400).send(error);
		}
	});

	instance.post("/bybit", async (req: FastifyRequest<RouteGenericQuery>, res: FastifyReply) => {
		const { symbol } = req.query;
		const { strategy, comment, exchange: _ecx, ticker } = req.body;
		const side = capitalizeFirstLetter(strategy.order_action);
		const qty = Number(strategy.order_contracts);
		const reduceOnly = comment.includes("Close");

		console.log({ symbol });

		try {
			const order = await client.placeActiveOrder({
				symbol,
				side,
				order_type: "Limit",
				price: 50,
				qty,
				// reduce_only: reduceOnly,
				// close_on_trigger: reduceOnly,
				time_in_force: "GoodTillCancel",
			});

			console.log({ order });

			await sendMessage(
				`
🌕 *${ticker}*

${strategy.order_action === "buy" ? "❇️ Long" : "🔴 Short"}

💰 Enter price: *${strategy.order_price}*

🧮 Qty: *${strategy.order_contracts}*

🗒 Comment: *${comment}*

[*${_ecx}*]`
			);

			res.code(200).header("Content-Type", "application/json; charset=utf-8").send(order);
		} catch (error: any) {
			console.dir(error);
			await sendMessage(error.message);
			res.status(400).send(error);
		}
	});

	instance.get("/ping", async (req: FastifyRequest<RouteGenericQuery>, res: FastifyReply) => {
		res.status(200).send({
			message: "pong",
		});
	});

	instance.post("/print", async (req: FastifyRequest<RouteGenericQuery>, res: FastifyReply) => {
		const { symbol } = req.query;
		const { strategy, comment, exchange: _ecx, ticker } = req.body;
		const side = capitalizeFirstLetter(strategy.order_action);
		const qty = Number(strategy.order_contracts);
		const reduceOnly = comment.includes("Close");

		await sendMessage(`
🌕 *${ticker}*

${strategy.order_action === "buy" ? "❇️ Long" : "🔴 Short"}

💰 Enter price: *${strategy.order_price}*

🧮 Qty: *${strategy.order_contracts}*

🗒 Comment: *${comment}* — 123

[*${_ecx}*]
`);
		res.status(200).send({
			message: "Print",
		});
	});

	done();
}
