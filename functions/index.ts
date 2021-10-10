import { FastifyInstance, FastifyReply, FastifyRequest, FastifyServerOptions } from "fastify";
import ccxt from "ccxt";
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

console.log({ API_KEY, PRIVATE_KEY });

const exchange = new ccxt.bybit({
	apiKey: API_KEY,
	secret: PRIVATE_KEY,
	enableRateLimit: true,
});
exchange.setSandboxMode(true);

function capitalizeFirstLetter(string: string) {
	return string[0].toUpperCase() + string.slice(1);
}

export default async function (instance: FastifyInstance, opts: FastifyServerOptions, done: any) {
	instance.post("/bybit", async (req: FastifyRequest<RouteGenericQuery>, res: FastifyReply) => {
		const { symbol } = req.query;
		const { strategy, comment, exchange: _ecx } = req.body;
		const side = capitalizeFirstLetter(strategy.order_action);
		const qty = Number(strategy.order_contracts);
		const reduceOnly = comment.includes("Close");

		try {
			const order = await exchange.createOrder(symbol, "Market", side as any, qty, 0, {
				reduce_only: reduceOnly,
				time_in_force: "GoodTillCancel",
			});

			console.log(order);

			await sendMessage(`*${symbol}*\n${comment}\n*${qty}* — ${side}`);
			await sendMessage(`✅ Took on *${_ecx}* — *${side}* — *${symbol}* – QTY: *${qty}*`);

			res.code(200).header("Content-Type", "application/json; charset=utf-8").send(order);
		} catch (error: any) {
			await sendMessage(error.message);
			res.status(400).send(error);
		}
	});

	instance.post("/ping", async (req: FastifyRequest<RouteGenericQuery>, res: FastifyReply) => {
		res.status(200).send({
			message: "pong",
		});
	});

	instance.post("/print", async (req: FastifyRequest<RouteGenericQuery>, res: FastifyReply) => {
		const { symbol } = req.query;
		const { strategy, comment, exchange: _ecx } = req.body;
		const side = capitalizeFirstLetter(strategy.order_action);
		const qty = Number(strategy.order_contracts);
		const reduceOnly = comment.includes("Close");

		await sendMessage(`${JSON.stringify({ strategy, comment, _ecx, symbol, side, reduceOnly }, null, 2)}`);
		res.status(200).send({
			message: "Print",
		});
	});

	done();
}
