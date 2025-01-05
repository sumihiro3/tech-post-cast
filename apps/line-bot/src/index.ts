import { Hono } from 'hono';


type Bindings = {
  LINE_CHANNEL_ACCESS_TOKEN: string;
  LINE_CHANNEL_SECRET: string;
};

const app = new Hono<{Bindings: Bindings}>()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app
