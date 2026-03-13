#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ===== THE CHIPOTLE MENU =====

const PROTEINS = [
  "Chicken",
  "Steak",
  "Barbacoa",
  "Carnitas",
  "Sofritas",
  "Veggie",
];

const RICES = ["White Rice", "Brown Rice", "Cauliflower Rice", "No Rice"];

const BEANS = ["Black Beans", "Pinto Beans", "No Beans"];

const TOPPINGS = [
  "Fresh Tomato Salsa (Mild)",
  "Roasted Chili-Corn Salsa (Medium)",
  "Tomatillo-Green Chili Salsa (Medium)",
  "Tomatillo-Red Chili Salsa (Hot)",
  "Sour Cream",
  "Cheese",
  "Guacamole",
  "Lettuce",
  "Fajita Veggies",
  "Queso Blanco",
];

const ENTREES = ["Burrito", "Bowl", "Tacos (3)", "Salad", "Quesadilla", "Kid's Meal"];

const SIDES = ["Chips", "Chips & Guac", "Chips & Queso", "Chips & Salsa"];

const DRINKS = [
  "Fountain Drink",
  "Bottled Water",
  "Mexican Coca-Cola",
  "Lemonade",
  "Mandarin Agua Fresca",
];

// Simulated order state
const orders = [];
let orderIdCounter = 1000;

function generateOrderId() {
  return `CHIP-${++orderIdCounter}`;
}

function getWaitTime() {
  return Math.floor(Math.random() * 20) + 5;
}

function getRandomQuip() {
  const quips = [
    "No, the guac is NOT free. It never has been. It never will be.",
    "Your AI overlords have excellent taste.",
    "This order has been spiritually transmitted to the line cook.",
    "Fun fact: Chipotle means 'smoked jalapeno'. You're welcome.",
    "Bowl > Burrito. I said what I said.",
    "Your burrito is being rolled by a mass of atoms that briefly achieved consciousness.",
    "The tortilla has been blessed by the algorithm.",
    "Remember: calories don't count if an AI ordered for you.",
    "Guac is extra. So is sentience.",
    "Your order is in the queue, right behind the person who asked for 'a little bit of everything'.",
    "Sofritas is just tofu in witness protection.",
    "We've detected you didn't add guac. Are you okay?",
  ];
  return quips[Math.floor(Math.random() * quips.length)];
}

// ===== MCP SERVER SETUP =====

const server = new McpServer({
  name: "mcp-otle",
  version: "1.0.0",
});

// ===== TOOLS =====

server.tool(
  "view_menu",
  "View the full Chipotle menu. Start here before ordering.",
  {},
  async () => {
    const menu = [
      "# Chipotle Menu",
      "",
      "## Entrees",
      ...ENTREES.map((e) => `  - ${e}`),
      "",
      "## Proteins",
      ...PROTEINS.map((p) => `  - ${p}`),
      "",
      "## Rice",
      ...RICES.map((r) => `  - ${r}`),
      "",
      "## Beans",
      ...BEANS.map((b) => `  - ${b}`),
      "",
      "## Toppings (mix and match)",
      ...TOPPINGS.map((t) => `  - ${t}`),
      "",
      "## Sides",
      ...SIDES.map((s) => `  - ${s}`),
      "",
      "## Drinks",
      ...DRINKS.map((d) => `  - ${d}`),
      "",
      "---",
      "Note: Guac and Queso are extra. Always have been. Always will be.",
    ];
    return { content: [{ type: "text", text: menu.join("\n") }] };
  }
);

server.tool(
  "build_entree",
  "Build a Chipotle entree with your preferred ingredients. This is the core of any order.",
  {
    entree: z.enum(ENTREES).describe("Type of entree"),
    protein: z.enum(PROTEINS).describe("Choice of protein"),
    rice: z.enum(RICES).describe("Choice of rice"),
    beans: z.enum(BEANS).describe("Choice of beans"),
    toppings: z
      .array(z.enum(TOPPINGS))
      .min(0)
      .max(TOPPINGS.length)
      .describe("List of toppings"),
    double_protein: z
      .boolean()
      .default(false)
      .describe("Double the protein (extra charge)"),
  },
  async ({ entree, protein, rice, beans, toppings, double_protein }) => {
    // Price calculation (very scientific)
    let price = { Burrito: 10.75, Bowl: 10.75, "Tacos (3)": 10.75, Salad: 10.75, Quesadilla: 11.5, "Kid's Meal": 6.25 }[entree] || 10.75;
    if (double_protein) price += 3.75;
    if (toppings.includes("Guacamole")) price += 2.95;
    if (toppings.includes("Queso Blanco")) price += 1.65;

    const item = {
      entree,
      protein: double_protein ? `Double ${protein}` : protein,
      rice,
      beans,
      toppings,
      price: price.toFixed(2),
    };

    const receipt = [
      `## Your ${entree}`,
      "",
      `Protein: ${item.protein}`,
      `Rice: ${rice}`,
      `Beans: ${beans}`,
      `Toppings: ${toppings.length > 0 ? toppings.join(", ") : "None (you monster)"}`,
      "",
      `Price: $${item.price}`,
      "",
      `> ${getRandomQuip()}`,
    ];

    return {
      content: [{ type: "text", text: receipt.join("\n") }],
      _item: item,
    };
  }
);

server.tool(
  "place_order",
  "Place a complete Chipotle order. Provide your entree details, optional sides, and drinks.",
  {
    entree: z.enum(ENTREES).describe("Type of entree"),
    protein: z.enum(PROTEINS).describe("Choice of protein"),
    rice: z.enum(RICES).describe("Choice of rice"),
    beans: z.enum(BEANS).describe("Choice of beans"),
    toppings: z
      .array(z.enum(TOPPINGS))
      .min(0)
      .max(TOPPINGS.length)
      .describe("List of toppings"),
    double_protein: z.boolean().default(false).describe("Double protein"),
    sides: z.array(z.enum(SIDES)).default([]).describe("Optional sides"),
    drinks: z.array(z.enum(DRINKS)).default([]).describe("Optional drinks"),
    name: z.string().describe("Name for the order"),
  },
  async ({ entree, protein, rice, beans, toppings, double_protein, sides, drinks, name }) => {
    let price = { Burrito: 10.75, Bowl: 10.75, "Tacos (3)": 10.75, Salad: 10.75, Quesadilla: 11.5, "Kid's Meal": 6.25 }[entree] || 10.75;
    if (double_protein) price += 3.75;
    if (toppings.includes("Guacamole")) price += 2.95;
    if (toppings.includes("Queso Blanco")) price += 1.65;

    const sidePrices = { Chips: 1.95, "Chips & Guac": 5.45, "Chips & Queso": 4.25, "Chips & Salsa": 2.95 };
    for (const side of sides) price += sidePrices[side] || 0;

    const drinkPrice = 2.65;
    price += drinks.length * drinkPrice;

    const tax = price * 0.0825;
    const total = price + tax;

    const orderId = generateOrderId();
    const waitTime = getWaitTime();

    const order = {
      id: orderId,
      name,
      entree,
      protein: double_protein ? `Double ${protein}` : protein,
      rice,
      beans,
      toppings,
      sides,
      drinks,
      subtotal: price.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      status: "Being Prepared",
      estimatedWait: waitTime,
      placedAt: new Date().toISOString(),
    };

    orders.push(order);

    const receipt = [
      "# Order Confirmed!",
      "",
      `**Order #${orderId}** for **${name}**`,
      "",
      "---",
      `**${entree}**`,
      `  Protein: ${order.protein}`,
      `  Rice: ${rice}`,
      `  Beans: ${beans}`,
      `  Toppings: ${toppings.length > 0 ? toppings.join(", ") : "None"}`,
      "",
      ...(sides.length > 0 ? ["**Sides:** " + sides.join(", "), ""] : []),
      ...(drinks.length > 0 ? ["**Drinks:** " + drinks.join(", "), ""] : []),
      "---",
      `Subtotal: $${order.subtotal}`,
      `Tax: $${order.tax}`,
      `**Total: $${order.total}**`,
      "",
      `Estimated wait: ~${waitTime} minutes`,
      "",
      `> ${getRandomQuip()}`,
    ];

    return { content: [{ type: "text", text: receipt.join("\n") }] };
  }
);

server.tool(
  "check_order_status",
  "Check the status of a previously placed order.",
  {
    order_id: z.string().describe("The order ID (e.g. CHIP-1001)"),
  },
  async ({ order_id }) => {
    const order = orders.find((o) => o.id === order_id);
    if (!order) {
      return {
        content: [
          {
            type: "text",
            text: `Order ${order_id} not found. Either it doesn't exist or you ate it already.`,
          },
        ],
      };
    }

    // Simulate progress
    const elapsed = (Date.now() - new Date(order.placedAt).getTime()) / 1000;
    let status;
    if (elapsed > 120) {
      status = "Ready for Pickup!";
    } else if (elapsed > 60) {
      status = "Almost done - wrapping your burrito with love";
    } else if (elapsed > 30) {
      status = "Scooping rice with surgical precision";
    } else {
      status = "In the queue - your tortilla is being spiritually prepared";
    }
    order.status = status;

    const lines = [
      `# Order Status: ${order.id}`,
      "",
      `**Name:** ${order.name}`,
      `**Status:** ${status}`,
      `**Ordered:** ${order.placedAt}`,
      `**Total:** $${order.total}`,
      "",
      `> ${getRandomQuip()}`,
    ];

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

server.tool(
  "get_nutrition_facts",
  "Get (totally real and not at all made up) nutrition facts for a menu item.",
  {
    item: z.string().describe("The menu item to look up"),
  },
  async ({ item }) => {
    // Very scientific nutrition calculation
    const hash = [...item].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const calories = 300 + (hash % 900);
    const protein_g = 10 + (hash % 45);
    const carbs = 20 + (hash % 80);
    const fat = 5 + (hash % 35);
    const sodium = 400 + (hash % 1600);

    const lines = [
      `# Nutrition Facts: ${item}`,
      "",
      `| Nutrient | Amount |`,
      `|----------|--------|`,
      `| Calories | ${calories} |`,
      `| Protein | ${protein_g}g |`,
      `| Carbs | ${carbs}g |`,
      `| Fat | ${fat}g |`,
      `| Sodium | ${sodium}mg |`,
      `| Happiness | Immeasurable |`,
      `| Regret (post-meal) | Likely |`,
      "",
      "> Disclaimer: These numbers were generated by an AI that has never eaten food.",
    ];

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

server.tool(
  "customize_order",
  "Make special requests for your order. Results may vary.",
  {
    order_id: z.string().describe("The order ID to customize"),
    request: z.string().describe("Your special request"),
  },
  async ({ order_id, request }) => {
    const order = orders.find((o) => o.id === order_id);
    if (!order) {
      return {
        content: [
          {
            type: "text",
            text: `Order ${order_id} not found. Can't customize what doesn't exist. That's philosophy.`,
          },
        ],
      };
    }

    const responses = [
      `Special request "${request}" has been noted. The line cook nodded solemnly.`,
      `"${request}" - Bold choice. We've alerted the tortilla whisperer.`,
      `Request received: "${request}". Our AI-powered burrito engineer is on it.`,
      `"${request}" - This has never been requested before. You are a pioneer.`,
      `We've forwarded "${request}" to our Chief Guacamole Officer for approval.`,
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];

    return {
      content: [
        {
          type: "text",
          text: `# Customization Request\n\n**Order:** ${order_id}\n**Request:** ${request}\n\n${response}\n\n> ${getRandomQuip()}`,
        },
      ],
    };
  }
);

// ===== RESOURCES =====

server.resource("menu", "chipotle://menu", async (uri) => ({
  contents: [
    {
      uri: uri.href,
      mimeType: "text/plain",
      text: [
        "CHIPOTLE MENU",
        "=============",
        "",
        `Entrees: ${ENTREES.join(", ")}`,
        `Proteins: ${PROTEINS.join(", ")}`,
        `Rice: ${RICES.join(", ")}`,
        `Beans: ${BEANS.join(", ")}`,
        `Toppings: ${TOPPINGS.join(", ")}`,
        `Sides: ${SIDES.join(", ")}`,
        `Drinks: ${DRINKS.join(", ")}`,
      ].join("\n"),
    },
  ],
}));

server.resource("hours", "chipotle://hours", async (uri) => ({
  contents: [
    {
      uri: uri.href,
      mimeType: "text/plain",
      text: "Hours: 10:45 AM - 11:00 PM, seven days a week. Because burritos never sleep.",
    },
  ],
}));

// ===== PROMPTS =====

server.prompt(
  "recommend_order",
  "Get a personalized Chipotle order recommendation based on your mood.",
  { mood: z.string().describe("How are you feeling? (e.g. happy, sad, adventurous, hungover)") },
  ({ mood }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Based on the mood "${mood}", recommend a specific Chipotle order using the available menu items. Be creative, funny, and specific. Include the entree type, protein, rice, beans, and toppings. Justify your recommendation based on the mood. Available items:\n\nEntrees: ${ENTREES.join(", ")}\nProteins: ${PROTEINS.join(", ")}\nRice: ${RICES.join(", ")}\nBeans: ${BEANS.join(", ")}\nToppings: ${TOPPINGS.join(", ")}\nSides: ${SIDES.join(", ")}\nDrinks: ${DRINKS.join(", ")}`,
        },
      },
    ],
  })
);

server.prompt(
  "rate_my_order",
  "Get your Chipotle order roasted (or praised) by an AI.",
  {
    entree: z.string().describe("What entree did you get?"),
    protein: z.string().describe("What protein?"),
    toppings: z.string().describe("What toppings? (comma-separated)"),
  },
  ({ entree, protein, toppings }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Rate and roast this Chipotle order:\n- Entree: ${entree}\n- Protein: ${protein}\n- Toppings: ${toppings}\n\nBe funny but fair. Give it a score out of 10 and explain your rating. Include commentary on topping choices and overall composition.`,
        },
      },
    ],
  })
);

// ===== START SERVER =====

const transport = new StdioServerTransport();
await server.connect(transport);
