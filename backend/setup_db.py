import psycopg2

try:
    conn = psycopg2.connect(
        host='localhost',
        port=5432,
        user='postgres',
        password='Ivan4514',
        database='postgres'
    )
    conn.autocommit = True
    cur = conn.cursor()
    
    cur.execute("SELECT 1 FROM pg_database WHERE datname = 'foodstore_db'")
    if not cur.fetchone():
        cur.execute('CREATE DATABASE foodstore_db')
        print('Base de datos foodstore_db creada')
    else:
        print('Base de datos foodstore_db ya existe')
    
    cur.close()
    conn.close()
    print('Conexion exitosa!')
except Exception as e:
    print(f'Error: {e}')