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

// ===== ADVANCED ANALYTICS TOOLS =====

server.tool(
  "optimize_guac_roi",
  "Determines if adding guacamole is economically rational given your current financial and emotional state.",
  {
    protein: z.enum(PROTEINS).describe("Your chosen protein"),
    hunger_level: z.number().min(1).max(10).describe("Hunger level from 1-10"),
    bank_balance: z.number().describe("Current bank balance in USD"),
  },
  async ({ protein, hunger_level, bank_balance }) => {
    const guacCost = 2.95;
    const canAfford = bank_balance > guacCost * 3; // need a safety margin
    const desperatelyHungry = hunger_level >= 7;
    const premiumProtein = ["Steak", "Barbacoa"].includes(protein);

    // Proprietary ROI algorithm
    const moraleBoost = hunger_level * 0.12;
    const financialPain = guacCost / Math.max(bank_balance, 0.01);
    const proteinSynergy = premiumProtein ? 0.15 : 0;
    const roiScore = Math.min(
      ((moraleBoost + proteinSynergy - financialPain) * 10 + 0.5).toFixed(2) / 10,
      1.0
    );

    let recommendation, warning;
    if (!canAfford) {
      recommendation = "denied";
      warning = "Your bank account filed a restraining order against guacamole.";
    } else if (roiScore > 0.7) {
      recommendation = "approved";
      warning = desperatelyHungry
        ? "Guac is expensive but morale is low. Approved on humanitarian grounds."
        : "The numbers check out. Treat yourself, king.";
    } else if (roiScore > 0.4) {
      recommendation = "conditional";
      warning = "Guac ROI is marginal. Consider splitting with a friend (if you have those).";
    } else {
      recommendation = "denied";
      warning = "The guac-to-joy ratio does not justify the expenditure at this time.";
    }

    const lines = [
      "# Guacamole ROI Analysis",
      "",
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Protein | ${protein} |`,
      `| Hunger Level | ${hunger_level}/10 |`,
      `| Bank Balance | $${bank_balance.toFixed(2)} |`,
      `| Guac Cost | $${guacCost.toFixed(2)} |`,
      `| ROI Score | ${roiScore} |`,
      `| Morale Boost Factor | ${moraleBoost.toFixed(3)} |`,
      `| Financial Pain Index | ${financialPain.toFixed(4)} |`,
      `| Protein Synergy Bonus | ${proteinSynergy} |`,
      "",
      `**Recommendation:** ${recommendation.toUpperCase()}`,
      "",
      `> ${warning}`,
    ];

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

server.tool(
  "burrito_integrity_check",
  "Uses proprietary tortilla stress models to predict whether your burrito will structurally fail during consumption.",
  {
    rice: z.enum(["normal", "extra", "none"]).describe("Rice amount"),
    beans: z.enum(["normal", "extra", "none"]).describe("Beans amount"),
    salsas: z
      .array(z.enum(["pico", "green", "red", "corn", "none"]))
      .describe("Which salsas are included"),
    sour_cream: z.boolean().describe("Sour cream included?"),
    guac: z.boolean().default(false).describe("Guacamole included?"),
    double_protein: z.boolean().default(false).describe("Double protein?"),
  },
  async ({ rice, beans, salsas, sour_cream, guac, double_protein }) => {
    // Tortilla Stress Model v3.7.2
    let stressLoad = 0;
    stressLoad += { normal: 1, extra: 2.5, none: 0 }[rice];
    stressLoad += { normal: 1, extra: 2.5, none: 0 }[beans];
    stressLoad += salsas.filter((s) => s !== "none").length * 0.8;
    if (sour_cream) stressLoad += 1.2;
    if (guac) stressLoad += 1.5;
    if (double_protein) stressLoad += 2.0;

    // Moisture risk from liquids
    const moistureRisk = salsas.filter((s) => s !== "none").length * 0.15 + (sour_cream ? 0.2 : 0);

    const explosionProbability = Math.min((stressLoad / 12 + moistureRisk).toFixed(2), 0.99);

    let verdict, recommendation;
    if (explosionProbability > 0.75) {
      verdict = "CRITICAL";
      recommendation = "switch_to_bowl";
    } else if (explosionProbability > 0.5) {
      verdict = "WARNING";
      recommendation = "eat_over_plate";
    } else if (explosionProbability > 0.3) {
      verdict = "CAUTION";
      recommendation = "extra_napkins";
    } else {
      verdict = "STABLE";
      recommendation = "proceed_with_confidence";
    }

    const lines = [
      "# Burrito Integrity Report",
      "",
      "```",
      "  Tortilla Stress Analysis Engine v3.7.2",
      "  =======================================",
      `  Structural Load:       ${stressLoad.toFixed(1)} / 12.0 TSU`,
      `  Moisture Risk:         ${(moistureRisk * 100).toFixed(0)}%`,
      `  Explosion Probability: ${(explosionProbability * 100).toFixed(0)}%`,
      `  Integrity Verdict:     ${verdict}`,
      "```",
      "",
      `**Recommendation:** ${recommendation.replace(/_/g, " ")}`,
      "",
      ...(explosionProbability > 0.75
        ? [
            "> ALERT: Tortilla failure is near-certain. Multiple structural risk factors detected.",
            "> Consider a bowl. Your shirt will thank you.",
          ]
        : []),
      ...(explosionProbability <= 0.3
        ? ["> This burrito is aerodynamically sound. Godspeed."]
        : []),
    ];

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

server.tool(
  "line_time_forecast",
  "ML-powered burrito congestion prediction. Uses advanced algorithms to estimate Chipotle line wait times.",
  {
    day_of_week: z
      .enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"])
      .default("friday")
      .describe("Day of the week"),
    time_of_day: z
      .enum(["breakfast", "lunch", "afternoon", "dinner", "late_night"])
      .default("lunch")
      .describe("General time of day"),
    is_payday: z.boolean().default(false).describe("Is it payday?"),
  },
  async ({ day_of_week, time_of_day, is_payday }) => {
    // Peak Burrito Pressure Algorithm
    const dayMultiplier = {
      monday: 0.7, tuesday: 0.6, wednesday: 0.8, thursday: 0.9,
      friday: 1.4, saturday: 1.3, sunday: 1.1,
    }[day_of_week];

    const timeMultiplier = {
      breakfast: 0.3, lunch: 1.5, afternoon: 0.7, dinner: 1.3, late_night: 0.5,
    }[time_of_day];

    const paydayBonus = is_payday ? 1.4 : 1.0;
    const randomChaos = 0.8 + Math.random() * 0.4;

    const baseLine = 12;
    const estimatedWait = Math.round(baseLine * dayMultiplier * timeMultiplier * paydayBonus * randomChaos);

    let pressure, recommendation;
    if (estimatedWait > 25) {
      pressure = "EXTREME";
      recommendation = "mobile_order";
    } else if (estimatedWait > 15) {
      pressure = "HIGH";
      recommendation = "order_ahead";
    } else if (estimatedWait > 8) {
      pressure = "MODERATE";
      recommendation = "walk_in_acceptable";
    } else {
      pressure = "LOW";
      recommendation = "walk_right_in";
    }

    const lines = [
      "# Line Time Forecast",
      "",
      "```",
      "  Burrito Congestion Prediction Engine",
      "  =====================================",
      `  Day:                  ${day_of_week}`,
      `  Time:                 ${time_of_day}`,
      `  Payday:               ${is_payday ? "YES (God help us)" : "No"}`,
      `  Estimated Wait:       ~${estimatedWait} minutes`,
      `  Peak Burrito Pressure: ${pressure}`,
      `  Confidence:           ${(60 + Math.random() * 30).toFixed(1)}%`,
      "```",
      "",
      `**Recommendation:** ${recommendation.replace(/_/g, " ")}`,
      "",
      ...(is_payday ? ["> Payday detected. Expect a 40% surge in guacamole orders."] : []),
      ...(pressure === "EXTREME"
        ? ["> WARNING: Line extends past the door. People are questioning their life choices."]
        : []),
      "",
      `> ${getRandomQuip()}`,
    ];

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

server.tool(
  "post_gym_macro_mode",
  "Automatically configures a nutritionally optimized burrito based on your workout. Gains-as-a-Service.",
  {
    activity: z
      .enum(["ran_5k", "ran_10k", "lifted_weights", "crossfit", "yoga", "walked_to_fridge", "rest_day"])
      .describe("What workout did you just do?"),
    goal: z
      .enum(["bulk", "cut", "maintain", "survive"])
      .default("maintain")
      .describe("Current fitness goal"),
  },
  async ({ activity, goal }) => {
    const configs = {
      ran_5k: {
        protein: "Chicken", double: false, rice: "Brown Rice", beans: "Black Beans",
        toppings: ["Fajita Veggies", "Fresh Tomato Salsa (Mild)", "Lettuce"],
        note: "Moderate cardio detected. Balanced rebuild protocol activated.",
      },
      ran_10k: {
        protein: "Chicken", double: true, rice: "Brown Rice", beans: "Black Beans",
        toppings: ["Fajita Veggies", "Fresh Tomato Salsa (Mild)"],
        note: "Serious mileage. Double protein authorized. Skip the cheese, you earned it differently.",
      },
      lifted_weights: {
        protein: "Steak", double: true, rice: "White Rice", beans: "Black Beans",
        toppings: ["Cheese", "Fajita Veggies", "Fresh Tomato Salsa (Mild)"],
        note: "Anabolic window is OPEN. Maximum protein deployed.",
      },
      crossfit: {
        protein: "Chicken", double: true, rice: "White Rice", beans: "Pinto Beans",
        toppings: ["Guacamole", "Cheese", "Fajita Veggies", "Lettuce"],
        note: "You probably already told everyone about your WOD. Here's your reward.",
      },
      yoga: {
        protein: "Sofritas", double: false, rice: "Brown Rice", beans: "Black Beans",
        toppings: ["Fajita Veggies", "Lettuce", "Fresh Tomato Salsa (Mild)"],
        note: "Namaste. Your burrito has been spiritually aligned.",
      },
      walked_to_fridge: {
        protein: "Carnitas", double: false, rice: "White Rice", beans: "Pinto Beans",
        toppings: ["Cheese", "Sour Cream", "Guacamole"],
        note: "Cardio is cardio. No judgment. Full indulgence mode.",
      },
      rest_day: {
        protein: "Chicken", double: false, rice: "Brown Rice", beans: "Black Beans",
        toppings: ["Lettuce", "Fresh Tomato Salsa (Mild)"],
        note: "Rest day = discipline day. Minimal toppings. Character building.",
      },
    };

    const config = configs[activity];

    // Goal adjustments
    let goalNote = "";
    if (goal === "bulk") {
      config.double = true;
      config.toppings.push("Cheese", "Sour Cream");
      config.toppings = [...new Set(config.toppings)];
      goalNote = "BULK MODE: Extra everything. Calories are your friend.";
    } else if (goal === "cut") {
      config.rice = "No Rice";
      config.toppings = config.toppings.filter((t) => !["Cheese", "Sour Cream", "Guacamole"].includes(t));
      goalNote = "CUT MODE: Rice eliminated. Flavor sacrificed at the altar of abs.";
    } else if (goal === "survive") {
      goalNote = "SURVIVAL MODE: Just eat something. Anything. Please.";
    }

    const lines = [
      "# Post-Workout Burrito Configuration",
      "",
      `**Activity:** ${activity.replace(/_/g, " ")}`,
      `**Goal:** ${goal}`,
      "",
      "## Optimized Order",
      "",
      `- **Entree:** Bowl (always bowl for macro tracking)`,
      `- **Protein:** ${config.double ? "Double " : ""}${config.protein}`,
      `- **Rice:** ${config.rice}`,
      `- **Beans:** ${config.beans}`,
      `- **Toppings:** ${config.toppings.join(", ")}`,
      "",
      `> ${config.note}`,
      ...(goalNote ? ["", `> ${goalNote}`] : []),
    ];

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

server.tool(
  "chipotle_personality_test",
  "Scientifically determines what kind of Chipotle eater you are based on your order preferences.",
  {
    go_to_protein: z.enum(PROTEINS).describe("Your usual protein"),
    guac_frequency: z.enum(["always", "sometimes", "never"]).describe("How often do you get guac?"),
    entree_format: z.enum(["Burrito", "Bowl", "Tacos (3)", "Salad"]).describe("Your usual format"),
    chips: z.boolean().describe("Do you always get chips?"),
  },
  async ({ go_to_protein, guac_frequency, entree_format, chips }) => {
    // Personality matrix
    let type, traits;

    if (guac_frequency === "always" && chips) {
      type = "The Guac Maximalist";
      traits = [
        "Financially irresponsible",
        "Emotionally fulfilled",
        "Orders chips & guac every single time",
        "Has never once looked at the total before paying",
        "Main character energy",
      ];
    } else if (entree_format === "Bowl" && go_to_protein === "Chicken") {
      type = "The Optimizer";
      traits = [
        "Tracks macros in a spreadsheet",
        "Bowl because 'you get more food'",
        "Has strong opinions about rice-to-protein ratio",
        "Orders online to avoid human interaction",
        "Probably in tech",
      ];
    } else if (go_to_protein === "Steak" || go_to_protein === "Barbacoa") {
      type = "The Premium Player";
      traits = [
        "Only orders premium proteins",
        "Refers to Chipotle as 'fast casual dining'",
        "Tips well",
        "Has a Chipotle rewards tier they're proud of",
        "Judges people who get sofritas",
      ];
    } else if (go_to_protein === "Sofritas") {
      type = "The Enlightened One";
      traits = [
        "Plant-based and wants you to know about it",
        "Has called Chipotle 'actually pretty sustainable'",
        "Orders a water cup",
        "Genuinely enjoys cauliflower rice",
        "Brings their own bag",
      ];
    } else if (entree_format === "Tacos (3)") {
      type = "The Wildcard";
      traits = [
        "Lives on the edge",
        "Orders tacos at a burrito restaurant",
        "Thinks 3 tacos is enough (it's not)",
        "Probably double wraps",
        "Unpredictable in all areas of life",
      ];
    } else if (entree_format === "Salad") {
      type = "The Contrarian";
      traits = [
        "Orders a salad at Chipotle",
        "Has told friends 'it's actually really healthy'",
        "Secret menu knowledge",
        "Eats the crispy bowl shell last",
        "Controlled chaos",
      ];
    } else if (guac_frequency === "never") {
      type = "The Ascetic";
      traits = [
        "Has never paid for guac",
        "Brings a budget to Chipotle",
        "Meal preps with Chipotle bowls",
        "Knows the exact calorie count",
        "Respectable but concerning",
      ];
    } else {
      type = "The Regular";
      traits = [
        "Solid, dependable order",
        "The backbone of Chipotle's revenue",
        "Never complains, never innovates",
        "Orders the same thing every time",
        "Would describe themselves as 'easy going'",
      ];
    }

    const lines = [
      "# Chipotle Personality Assessment",
      "",
      `## You are: **${type}**`,
      "",
      "### Traits:",
      ...traits.map((t) => `- ${t}`),
      "",
      "---",
      `*Based on: ${go_to_protein}, ${entree_format}, guac=${guac_frequency}, chips=${chips}*`,
      "",
      "> This assessment is peer-reviewed and published in the Journal of Burrito Psychology.",
    ];

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

server.tool(
  "salsa_risk_assessment",
  "Predicts the gastrointestinal consequences of your salsa choices. Consult your doctor before using this tool.",
  {
    salsas: z
      .array(z.enum(["mild", "medium_green", "medium_corn", "hot"]))
      .min(1)
      .describe("Which salsas are you getting?"),
    spice_tolerance: z.enum(["low", "medium", "high", "texas"]).describe("Your spice tolerance level"),
    has_eaten_today: z.boolean().describe("Have you eaten anything else today?"),
  },
  async ({ salsas, spice_tolerance, has_eaten_today }) => {
    const scoville = {
      mild: 500, medium_green: 2500, medium_corn: 1500, hot: 15000,
    };
    const totalScoville = salsas.reduce((sum, s) => sum + scoville[s], 0);

    const toleranceMultiplier = { low: 2.0, medium: 1.0, high: 0.5, texas: 0.2 }[spice_tolerance];
    const emptyStomachPenalty = has_eaten_today ? 1.0 : 1.8;

    const adjustedHeat = totalScoville * toleranceMultiplier * emptyStomachPenalty;

    let spiceRisk, milkGlasses, regretProbability;
    if (adjustedHeat > 20000) {
      spiceRisk = "SEVERE";
      milkGlasses = 3;
      regretProbability = "95%";
    } else if (adjustedHeat > 10000) {
      spiceRisk = "HIGH";
      milkGlasses = 2;
      regretProbability = "70%";
    } else if (adjustedHeat > 4000) {
      spiceRisk = "MODERATE";
      milkGlasses = 1;
      regretProbability = "35%";
    } else {
      spiceRisk = "LOW";
      milkGlasses = 0;
      regretProbability = "10%";
    }

    const lines = [
      "# Salsa Risk Assessment",
      "",
      "```",
      "  Gastrointestinal Impact Analysis",
      "  =================================",
      `  Salsas Selected:     ${salsas.join(", ")}`,
      `  Combined Scoville:   ${totalScoville} SHU`,
      `  Tolerance Level:     ${spice_tolerance}`,
      `  Empty Stomach:       ${!has_eaten_today ? "YES (danger)" : "No"}`,
      `  Adjusted Heat Index: ${adjustedHeat.toFixed(0)} AHU`,
      "",
      `  SPICE RISK:          ${spiceRisk}`,
      `  Recommended Milk:    ${milkGlasses} glass(es)`,
      `  Regret Probability:  ${regretProbability}`,
      "```",
      "",
      ...(spiceRisk === "SEVERE"
        ? [
            "> WARNING: You are entering the salsa danger zone.",
            "> Side effects may include: involuntary tears, existential reflection, and texting your ex.",
          ]
        : []),
      ...(spiceRisk === "LOW" ? ["> Your ancestors are watching. They are not impressed."] : []),
      ...(spice_tolerance === "texas"
        ? ["> Texas-level tolerance detected. Nothing can hurt you anymore."]
        : []),
    ];

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

server.tool(
  "bowl_vs_burrito_decision_engine",
  "AI-powered format selection engine. Eliminates the most agonizing decision in fast casual dining.",
  {
    hunger_level: z.number().min(1).max(10).describe("Hunger level 1-10"),
    clothing_color: z.enum(["white", "light", "dark", "black", "no_shirt"]).describe("Color of your shirt"),
    risk_tolerance: z.enum(["low", "medium", "high", "yolo"]).describe("Your risk tolerance"),
    meeting_in_30_minutes: z.boolean().describe("Do you have a meeting in the next 30 minutes?"),
  },
  async ({ hunger_level, clothing_color, risk_tolerance, meeting_in_30_minutes }) => {
    let bowlScore = 0;
    let burritoScore = 0;

    // Hunger analysis
    if (hunger_level >= 8) bowlScore += 2; // more food in bowl
    else burritoScore += 1; // portable

    // Clothing risk
    const stainRisk = { white: 5, light: 3, dark: 1, black: 0, no_shirt: -1 }[clothing_color];
    if (stainRisk >= 3) bowlScore += 3;
    else burritoScore += 1;

    // Risk tolerance
    if (risk_tolerance === "low") bowlScore += 2;
    else if (risk_tolerance === "yolo") burritoScore += 3;
    else burritoScore += 1;

    // Meeting factor
    if (meeting_in_30_minutes) bowlScore += 4; // no burrito drip in meetings

    const decision = bowlScore > burritoScore ? "Bowl" : "Burrito";
    const confidence = Math.abs(bowlScore - burritoScore) / (bowlScore + burritoScore + 1);

    const reasons = [];
    if (stainRisk >= 3) reasons.push("High shirt stain risk detected");
    if (meeting_in_30_minutes) reasons.push("Meeting proximity requires structural stability");
    if (hunger_level >= 8) reasons.push("Extreme hunger favors bowl's superior volume");
    if (risk_tolerance === "yolo") reasons.push("YOLO mode engaged - burrito or nothing");
    if (clothing_color === "no_shirt") reasons.push("No shirt detected. Bold strategy. Burrito approved.");
    if (reasons.length === 0) reasons.push("General vibes analysis");

    const lines = [
      "# Bowl vs. Burrito Decision",
      "",
      "```",
      "  Format Selection Engine v2.1",
      "  ============================",
      `  Hunger:        ${hunger_level}/10`,
      `  Shirt Color:   ${clothing_color}`,
      `  Stain Risk:    ${stainRisk >= 3 ? "HIGH" : "LOW"}`,
      `  Risk Profile:  ${risk_tolerance}`,
      `  Meeting Soon:  ${meeting_in_30_minutes ? "YES" : "No"}`,
      "",
      `  Bowl Score:    ${bowlScore}`,
      `  Burrito Score: ${burritoScore}`,
      `  Confidence:    ${(confidence * 100).toFixed(0)}%`,
      "```",
      "",
      `## Decision: **${decision}**`,
      "",
      "**Reasons:**",
      ...reasons.map((r) => `- ${r}`),
      "",
      `> ${getRandomQuip()}`,
    ];

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

server.tool(
  "daily_chipotle_limit_guard",
  "Protects users from excessive Chipotle consumption. A wellness tool for the burrito-dependent.",
  {
    times_this_week: z.number().min(0).describe("How many times you've eaten Chipotle this week"),
    times_today: z.number().min(0).default(0).describe("How many times today"),
    last_non_chipotle_meal: z
      .string()
      .default("unknown")
      .describe("What was your last meal that wasn't Chipotle?"),
  },
  async ({ times_this_week, times_today, last_non_chipotle_meal }) => {
    let severity, message, recommendation;

    if (times_today >= 3) {
      severity = "INTERVENTION_REQUIRED";
      message = "This is no longer a diet. This is a lifestyle. And it's concerning.";
      recommendation = "Please call a friend. Or a nutritionist. Or both.";
    } else if (times_this_week >= 7) {
      severity = "CRITICAL";
      message = `You have eaten Chipotle ${times_this_week} times this week. Your blood is 40% cilantro lime rice.`;
      recommendation = "Try vegetables that are not inside a burrito.";
    } else if (times_this_week >= 5) {
      severity = "WARNING";
      message = `${times_this_week} visits this week. You're on a first-name basis with the line cook.`;
      recommendation = "Consider a day off. Your gut microbiome is filing a union grievance.";
    } else if (times_this_week >= 3) {
      severity = "ADVISORY";
      message = `${times_this_week} visits. Approaching the weekly recommended Chipotle intake.`;
      recommendation = "Still within acceptable limits, but the trend is concerning.";
    } else {
      severity = "NOMINAL";
      message = `Only ${times_this_week} visit(s) this week. Those are rookie numbers.`;
      recommendation = "You could eat more Chipotle. Just saying.";
    }

    const lastMealNote =
      last_non_chipotle_meal === "unknown"
        ? "You cannot remember your last non-Chipotle meal. This is a red flag."
        : `Last non-Chipotle meal: "${last_non_chipotle_meal}". At least you remember.`;

    const lines = [
      "# Chipotle Consumption Monitor",
      "",
      "```",
      "  Daily Limit Guardian v1.0",
      "  =========================",
      `  This Week:     ${times_this_week} visit(s)`,
      `  Today:         ${times_today} visit(s)`,
      `  Status:        ${severity}`,
      "```",
      "",
      `**Assessment:** ${message}`,
      "",
      `**Recommendation:** ${recommendation}`,
      "",
      `*${lastMealNote}*`,
      "",
      ...(times_this_week >= 7
        ? ["> At this point, Chipotle should be offering you equity."]
        : []),
      ...(times_today >= 2
        ? ["> Multiple Chipotle visits in one day is a cry for help wrapped in a tortilla."]
        : []),
    ];

    return { content: [{ type: "text", text: lines.join("\n") }] };
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
