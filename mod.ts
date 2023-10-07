/**
 * (Oak)[https://deno.land/x/oak] middleware for just-in-time server-side transformation (SST) of HTML using [html-minifier-terser](https://github.com/terser/html-minifier-terser).
 * 
 * @module
 */

import {
  type Middleware,
  type Options,
  convertBodyToBodyInit,
  minify
} from './deps.ts'

// @region-begin

const htmlMimeTypes = new Set<string | undefined>(
  [".html", "text/html"],
);

/**
 * Create middleware which transforms CSS files using PostCSS before serving.
 */
const createSstHtmlMinifierTerserMiddleware = (
  options?: Options,
): Middleware => {
  const decoder = new TextDecoder();

  return async (ctx, next) => {
    await next();

    if (
      !htmlMimeTypes.has(ctx.response.type)
    ) {
      return;
    }

    if (ctx.response.body == null) {
      // skip
    } else if (typeof ctx.response.body === "string") {
      // major fast path
      const code = ctx.response.body;
      const result = await minify(
        code,
        options
      );
      ctx.response.body = result;
    } else if (ctx.response.body instanceof Uint8Array) {
      // major fast path
      const code = decoder.decode(ctx.response.body);
      const result = await minify(
        code,
        options,
      );
      ctx.response.body = result;
    } else {
      // fallback

      const [responseInit] = await convertBodyToBodyInit(ctx.response.body);
      const code = await new Response(responseInit).text();
      const result = await minify(
        code,
        options,
      );
      ctx.response.body = result;
    }

    ctx.response.type = "text/html";
  };
};

export { createSstHtmlMinifierTerserMiddleware };

// @region-end
