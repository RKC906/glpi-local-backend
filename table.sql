utilisons cette structure de table, on gardera id_status par defaut qui est 1,2,3 en version francaise et on aura qu'a traduire par rapport a cela dans la table kanban_translation et la couleur des kanbans
CREATE TABLE kanban_color
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_status INTEGER,
    color TEXT
);

CREATE TABLE kanban_translation
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_status INTEGER,
    langue TEXT,
    translation TEXT
);