# Mainland runtime application simulation

The runtime coverage gate proves that all 48 Mainland source files exist in presentation families. This simulation goes further and executes the real Adventure Land HD bootstrap against cloned definitions from the pinned original client.

For HD mode it verifies that:

- all 48 scoped source paths appear in ALHD.status().paths;
- every scoped source is applied to at least one real sprite or tileset definition;
- only the .file field changes;
- all other sprite and tileset metadata remains byte-equivalent after JSON serialization;
- the bootstrap's applied count matches the number of definitions actually changed.

The same bootstrap is then executed with ?alhd=off. In ORIGINAL mode it must apply zero replacements and the cloned presentation definitions must remain unchanged.

No gameplay functions, map geometry, collision data, networking or server state are executed by this simulation.
