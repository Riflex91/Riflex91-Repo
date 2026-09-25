const PUBLIC_FUNCTIONS = Object.freeze({
  smartMove: "smart_move",
  move: "move",
  attack: "attack",
  useSkill: "use_skill",
  loot: "loot",
  respawn: "respawn",
  sendCm: "send_cm",
  changeServer: "change_server",
  buy: "buy",
  sell: "sell",
  exchange: "exchange",
  upgrade: "upgrade",
  compound: "compound",
  craft: "craft",
  sendItem: "send_item",
  sendGold: "send_gold",
  bankStore: "bank_store",
  bankRetrieve: "bank_retrieve",
  bankSwap: "bank_swap",
});

function rootCandidates(root) {
  const out = [];
  if (root && typeof root === "object") out.push(root);
  try {
    if (root?.parent && root.parent !== root) out.push(root.parent);
  } catch {
    // Access to parent may be unavailable in isolated test contexts.
  }
  return out;
}

function resolvePublicFunction(root, name) {
  for (const candidate of rootCandidates(root)) {
    let fn;
    try {
      fn = candidate?.[name];
    } catch {
      continue;
    }
    if (typeof fn === "function") return fn.bind(candidate);
  }
  throw new Error("LIVE_LAB_PUBLIC_FUNCTION_UNAVAILABLE:" + name);
}

function call(root, name, args) {
  return resolvePublicFunction(root, name)(...args);
}

function ensureArray(value, label, length) {
  if (!Array.isArray(value) || value.length !== length) {
    throw new Error("LIVE_LAB_ARGUMENTS_INVALID:" + label);
  }
  return value;
}

export function createAdventureLandPorts(root = globalThis) {
  return Object.freeze({
    smartMove(destination) {
      return call(root, PUBLIC_FUNCTIONS.smartMove, [destination]);
    },
    move(x, y) {
      return call(root, PUBLIC_FUNCTIONS.move, [x, y]);
    },
    attack(target) {
      return call(root, PUBLIC_FUNCTIONS.attack, [target]);
    },
    useSkill(skill, target) {
      const args = target === undefined ? [skill] : [skill, target];
      return call(root, PUBLIC_FUNCTIONS.useSkill, args);
    },
    loot(...args) {
      return call(root, PUBLIC_FUNCTIONS.loot, args);
    },
    respawn() {
      return call(root, PUBLIC_FUNCTIONS.respawn, []);
    },
    sendCm(recipient, payload) {
      return call(root, PUBLIC_FUNCTIONS.sendCm, [recipient, payload]);
    },
    changeServer(region, identifier) {
      return call(root, PUBLIC_FUNCTIONS.changeServer, [region, identifier]);
    },
    buy(itemName, quantity) {
      return call(root, PUBLIC_FUNCTIONS.buy, [itemName, quantity]);
    },
    sell(inventoryIndex, quantity) {
      return call(root, PUBLIC_FUNCTIONS.sell, [inventoryIndex, quantity]);
    },
    exchange(inventoryIndex) {
      return call(root, PUBLIC_FUNCTIONS.exchange, [inventoryIndex]);
    },
    upgrade(inventoryIndex, scrollIndex, offeringIndex) {
      const args = offeringIndex === undefined
        ? [inventoryIndex, scrollIndex]
        : [inventoryIndex, scrollIndex, offeringIndex];
      return call(root, PUBLIC_FUNCTIONS.upgrade, args);
    },
    compound(indexes, scrollIndex, offeringIndex) {
      const [a, b, c] = ensureArray(indexes, "compound-indexes", 3);
      const args = offeringIndex === undefined
        ? [a, b, c, scrollIndex]
        : [a, b, c, scrollIndex, offeringIndex];
      return call(root, PUBLIC_FUNCTIONS.compound, args);
    },
    craft(itemName) {
      return call(root, PUBLIC_FUNCTIONS.craft, [itemName]);
    },
    sendItem(recipient, inventoryIndex, quantity) {
      return call(root, PUBLIC_FUNCTIONS.sendItem, [
        recipient,
        inventoryIndex,
        quantity,
      ]);
    },
    sendGold(recipient, amount) {
      return call(root, PUBLIC_FUNCTIONS.sendGold, [recipient, amount]);
    },
    bankStore(inventoryIndex, pack, packIndex) {
      return call(root, PUBLIC_FUNCTIONS.bankStore, [
        inventoryIndex,
        pack,
        packIndex,
      ]);
    },
    bankRetrieve(pack, packIndex, inventoryIndex) {
      const args = inventoryIndex === undefined
        ? [pack, packIndex]
        : [pack, packIndex, inventoryIndex];
      return call(root, PUBLIC_FUNCTIONS.bankRetrieve, args);
    },
    bankSwap(packA, indexA, packB, indexB) {
      return call(root, PUBLIC_FUNCTIONS.bankSwap, [
        packA,
        indexA,
        packB,
        indexB,
      ]);
    },
  });
}

export function inspectAdventureLandPortAvailability(root = globalThis) {
  const available = {};
  for (const [port, publicName] of Object.entries(PUBLIC_FUNCTIONS)) {
    let ok = false;
    for (const candidate of rootCandidates(root)) {
      try {
        if (typeof candidate?.[publicName] === "function") {
          ok = true;
          break;
        }
      } catch {
        // keep probing
      }
    }
    available[port] = ok;
  }
  return Object.freeze(available);
}

export const LIVE_LAB_PUBLIC_FUNCTIONS = PUBLIC_FUNCTIONS;
