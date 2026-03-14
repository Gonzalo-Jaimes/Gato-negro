import sqlite3

conexion = sqlite3.connect("empresa.db")

cursor = conexion.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS usuarios(
id INTEGER PRIMARY KEY AUTOINCREMENT,
usuario TEXT,
password TEXT,
rol TEXT
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS inventario(
id INTEGER PRIMARY KEY AUTOINCREMENT,
material TEXT,
cantidad INTEGER
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS mantenimiento(
id INTEGER PRIMARY KEY AUTOINCREMENT,
maquina TEXT,
tipo TEXT,
descripcion TEXT,
fecha TEXT
)
""")

conexion.commit()
conexion.close()

print("Base de datos creada correctamente")
cursor.execute("""
CREATE TABLE IF NOT EXISTS pedidos(
id INTEGER PRIMARY KEY AUTOINCREMENT,
material TEXT,
cantidad INTEGER,
usuario TEXT,
fecha TEXT
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS maquinas(
id INTEGER PRIMARY KEY AUTOINCREMENT,
nombre TEXT
)
""")