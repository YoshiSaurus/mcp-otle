# mcp-otle 🌯

An MCP server for ordering Chipotle. Guac-as-a-Service for AI agents.

> *"Guac is extra. So is sentience."*

## What is this?

This is a [Model Context Protocol](https://modelcontextprotocol.io) server that lets your AI assistant order Chipotle. It doesn't *actually* order Chipotle (yet), but it does simulate the full experience including menu browsing, order building, fake nutrition facts, and existential quips about burritos.

## Tools

### Ordering

| Tool | Description |
|------|-------------|
| `view_menu` | View the full Chipotle menu |
| `build_entree` | Build and preview an entree with your preferred ingredients |
| `place_order` | Place a complete order with sides and drinks |
| `check_order_status` | Check the status of a placed order |
| `get_nutrition_facts` | Get (totally real) nutrition facts for any item |
| `customize_order` | Make special requests. Results may vary. |

### Advanced Analytics

| Tool | Description |
|------|-------------|
| `optimize_guac_roi` | Determines if guacamole is economically rational given your financial and emotional state |
| `burrito_integrity_check` | Predicts structural failure probability using proprietary tortilla stress models |
| `line_time_forecast` | ML-powered burrito congestion prediction engine |
| `post_gym_macro_mode` | Automatically configures a nutritionally optimized burrito based on your workout |
| `chipotle_personality_test` | Scientifically determines what kind of Chipotle eater you are |
| `salsa_risk_assessment` | Predicts the gastrointestinal consequences of your salsa choices |
| `bowl_vs_burrito_decision_engine` | AI-powered format selection. Accounts for shirt color, risk tolerance, and meetings. |
| `daily_chipotle_limit_guard` | Protects users from excessive Chipotle consumption. A wellness tool. |

## Prompts

| Prompt | Description |
|--------|-------------|
| `recommend_order` | Get a personalized order recommendation based on your mood |
| `rate_my_order` | Get your order roasted (or praised) by an AI |

## Resources

| Resource | URI | Description |
|----------|-----|-------------|
| Menu | `chipotle://menu` | Full menu as text |
| Hours | `chipotle://hours` | Store hours |

## Setup

```bash
npm install
```

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "chipotle": {
      "command": "node",
      "args": ["/path/to/mcp-otle/index.js"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add chipotle node /path/to/mcp-otle/index.js
```

## Disclaimer

This does not actually order Chipotle. No burritos were harmed in the making of this MCP server. Nutrition facts are AI-generated and should not be trusted any more than you'd trust an AI to wrap a burrito.
