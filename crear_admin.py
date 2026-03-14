import sqlite3

conexion = sqlite3.connect("empresa.db")
cursor = conexion.cursor()

cursor.execute("""
INSERT INTO usuarios (usuario, password, rol)
VALUES ('admin', '1234', 'admin')
""")

conexion.commit()
conexion.close()

print("Usuario administrador creado")