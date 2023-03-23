import { env } from "./environment";
import Heroku from "heroku-client";

export const heroku = new Heroku({ token: env.herokuApiToken });
