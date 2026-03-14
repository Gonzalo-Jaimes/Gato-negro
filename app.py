from flask import Flask, render_template, request, redirect, session
import sqlite3
from datetime import datetime

app = Flask(__name__)
app.secret_key = "gato_negro"


# ---------------- LOGIN ----------------

@app.route("/")
def login():
    return render_template("login.html")


@app.route("/login", methods=["POST"])
def verificar_login():

    usuario = request.form["usuario"]
    password = request.form["password"]

    conexion = sqlite3.connect("empresa.db")
    cursor = conexion.cursor()

    cursor.execute(
        "SELECT * FROM usuarios WHERE usuario=? AND password=?",
        (usuario, password)
    )

    resultado = cursor.fetchone()
    conexion.close()

    if resultado:

        session["usuario"] = resultado[1]
        session["rol"] = resultado[3]

        if resultado[3] == "admin":
            return redirect("/inventario")

        if resultado[3] == "fabriquin":
            return redirect("/pedidos")

        if resultado[3] == "mantenimiento":
            return redirect("/mantenimiento")

    else:
        return "Usuario o contraseña incorrectos"


# ---------------- INVENTARIO ----------------

@app.route("/inventario")
def inventario():

    if "rol" not in session or session["rol"] != "admin":
        return redirect("/")

    conexion = sqlite3.connect("empresa.db")
    cursor = conexion.cursor()

    cursor.execute("SELECT * FROM inventario")
    materiales = cursor.fetchall()

    cursor.execute("SELECT COUNT(*) FROM inventario")
    total_materiales = cursor.fetchone()[0]

    cursor.execute("SELECT SUM(cantidad) FROM inventario")
    total_cantidad = cursor.fetchone()[0]

    conexion.close()

    return render_template(
        "inventario.html",
        materiales=materiales,
        total_materiales=total_materiales,
        total_cantidad=total_cantidad
    )


@app.route("/agregar_material", methods=["POST"])
def agregar_material():

    material = request.form["material"]
    cantidad = request.form["cantidad"]

    conexion = sqlite3.connect("empresa.db")
    cursor = conexion.cursor()

    cursor.execute(
        "INSERT INTO inventario (material, cantidad) VALUES (?,?)",
        (material, cantidad)
    )

    conexion.commit()
    conexion.close()

    return redirect("/inventario")


@app.route("/eliminar/<int:id>")
def eliminar(id):

    conexion = sqlite3.connect("empresa.db")
    cursor = conexion.cursor()

    cursor.execute("DELETE FROM inventario WHERE id=?", (id,))

    conexion.commit()
    conexion.close()

    return redirect("/inventario")


# ---------------- MANTENIMIENTO ----------------

@app.route("/mantenimiento")
def mantenimiento():

    if "rol" not in session:
        return redirect("/")

    if session["rol"] not in ["admin", "mantenimiento"]:
        return redirect("/")

    conexion = sqlite3.connect("empresa.db")
    cursor = conexion.cursor()

    cursor.execute("SELECT * FROM mantenimiento")
    mantenimientos = cursor.fetchall()

    conexion.close()

    return render_template("mantenimiento.html", mantenimientos=mantenimientos)


@app.route("/agregar_mantenimiento", methods=["POST"])
def agregar_mantenimiento():

    maquina = request.form["maquina"]
    tipo = request.form["tipo"]
    descripcion = request.form["descripcion"]
    fecha = request.form["fecha"]

    conexion = sqlite3.connect("empresa.db")
    cursor = conexion.cursor()

    cursor.execute(
        "INSERT INTO mantenimiento (maquina,tipo,descripcion,fecha) VALUES (?,?,?,?)",
        (maquina, tipo, descripcion, fecha)
    )

    conexion.commit()
    conexion.close()

    return redirect("/mantenimiento")


# ---------------- PEDIDOS ----------------

@app.route("/pedidos")
def pedidos():

    if "rol" not in session:
        return redirect("/")

    conexion = sqlite3.connect("empresa.db")
    cursor = conexion.cursor()

    if session["rol"] == "fabriquin":

        cursor.execute(
            "SELECT * FROM pedidos WHERE usuario=?",
            (session["usuario"],)
        )

    else:

        cursor.execute("SELECT * FROM pedidos")

    pedidos = cursor.fetchall()

    conexion.close()

    return render_template("pedidos.html", pedidos=pedidos)


# agregar pedido
@app.route("/agregar_pedido", methods=["POST"])
def agregar_pedido():

    material = request.form["material"]
    cantidad = request.form["cantidad"]
    usuario = session["usuario"]

    if material == "otros":
        material = request.form["material_otro"]

    fecha = datetime.now().strftime("%Y-%m-%d")

    conexion = sqlite3.connect("empresa.db")
    cursor = conexion.cursor()

    cursor.execute(
        "INSERT INTO pedidos (material,cantidad,usuario,fecha,estado) VALUES (?,?,?,?,?)",
        (material, cantidad, usuario, fecha, "pendiente")
    )

    conexion.commit()
    conexion.close()

    return redirect("/pedidos")


# ---------------- APROBAR PEDIDO ----------------

@app.route("/aprobar_pedido/<int:id>")
def aprobar_pedido(id):

    conn = sqlite3.connect("empresa.db")
    cursor = conn.cursor()

    # obtener pedido
    cursor.execute("SELECT material, cantidad FROM pedidos WHERE id=?", (id,))
    pedido = cursor.fetchone()

    material = pedido[0]
    cantidad = pedido[1]

    # revisar inventario
    cursor.execute("SELECT cantidad FROM inventario WHERE material=?", (material,))
    inventario = cursor.fetchone()

    if inventario and inventario[0] >= cantidad:

        # descontar inventario
        cursor.execute(
            "UPDATE inventario SET cantidad = cantidad - ? WHERE material=?",
            (cantidad, material)
        )

        cursor.execute(
            "UPDATE pedidos SET estado='aprobado' WHERE id=?",
            (id,)
        )

    else:

        cursor.execute(
            "UPDATE pedidos SET estado='rechazado' WHERE id=?",
            (id,)
        )

    conn.commit()
    conn.close()

    return redirect("/pedidos")


# ---------------- RECHAZAR PEDIDO ----------------

@app.route("/rechazar_pedido/<int:id>")
def rechazar_pedido(id):

    conn = sqlite3.connect("empresa.db")
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE pedidos SET estado='rechazado' WHERE id=?",
        (id,)
    )

    conn.commit()
    conn.close()

    return redirect("/pedidos")


# ---------------- USUARIOS ----------------

@app.route('/usuarios', methods=['GET', 'POST'])
def usuarios():

    conn = sqlite3.connect('empresa.db')
    cursor = conn.cursor()

    if request.method == 'POST':

        usuario = request.form['usuario']
        password = request.form['password']
        rol = request.form['rol']

        cursor.execute(
            "INSERT INTO usuarios (usuario,password,rol) VALUES (?,?,?)",
            (usuario, password, rol)
        )

        conn.commit()

    cursor.execute("SELECT * FROM usuarios")
    lista = cursor.fetchall()

    conn.close()

    return render_template("usuarios.html", usuarios=lista)


# ---------------- CREAR TABLAS ----------------

def crear_tablas():

    conn = sqlite3.connect("empresa.db")
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material TEXT,
    cantidad INTEGER,
    usuario TEXT,
    fecha TEXT,
    estado TEXT
    )
    """)

    conn.commit()
    conn.close()


crear_tablas()


# ---------------- LOGOUT ----------------

@app.route("/logout")
def logout():

    session.clear()

    return redirect("/")


# ---------------- INICIAR SERVIDOR ----------------

if __name__ == "__main__":
    app.run(debug=True)