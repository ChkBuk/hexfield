import 'resend';
export { renderers } from '../../renderers.mjs';

const prerender = false;
function bad(redirectTo) {
  return new Response(null, { status: 303, headers: { Location: redirectTo } });
}
const POST = async ({ request }) => {
  {
    console.error("[contact] RESEND_API_KEY is not set");
    return bad("/contact/?error=server#slide-2");
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
