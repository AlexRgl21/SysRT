--BASE DE DATOS EN POSTGRESQL --

CREATE TABLE roles (
    id SERIAL PRIMARY KEY, 
    nombre VARCHAR(25) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    rol_id INT REFERENCES roles(id) NOT NULL,
    pin VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sesiones_caja (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) NOT NULL,
    fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP NULL,
    monto_inicial DECIMAL(10,2) NOT NULL DEFAULT 0.00, 
    ventas_calculadas DECIMAL(10,2) DEFAULT 0.00,      
    monto_entregado DECIMAL(10,2) NULL,                
    estatus VARCHAR(20) DEFAULT 'abierta'             
);

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT
);

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    categoria_id INT REFERENCES categorias(id),
    precio_compra DECIMAL(10,2) NOT NULL DEFAULT 0.00, 
    precio_venta DECIMAL(10,2) NOT NULL,
    stock_actual DECIMAL(10,3) DEFAULT 0.000,        
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE codigos_barras (
    id SERIAL PRIMARY KEY,
    producto_id INT REFERENCES productos(id) NOT NULL,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    descripcion VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE proveedores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL, 
    telefono VARCHAR(25),
    dias_visita VARCHAR(50) NULL, 
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE compras (
    id SERIAL PRIMARY KEY,
    proveedor_id INT REFERENCES proveedores(id), 
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_compra DECIMAL(10,2) NOT NULL,
    estatus_pago VARCHAR(20) DEFAULT 'pagada', 
    saldo_pendiente DECIMAL(10,2) DEFAULT 0.00,
    notas TEXT
);

CREATE TABLE abonos_compras (
    id SERIAL PRIMARY KEY,
    compra_id INT REFERENCES compras(id) NOT NULL,
    usuario_id INT REFERENCES usuarios(id), 
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    monto DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(20) DEFAULT 'efectivo'
);

CREATE TABLE registro_visitas (
    id SERIAL PRIMARY KEY,
    proveedor_id INT REFERENCES proveedores(id) NOT NULL,
    fecha_visita DATE NOT NULL DEFAULT CURRENT_DATE,
    asistio BOOLEAN DEFAULT FALSE,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (proveedor_id, fecha_visita) 
);

CREATE TABLE ventas (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id),
    sesion_caja_id INT REFERENCES sesiones_caja(id), 
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(20) DEFAULT 'efectivo'
);

CREATE TABLE detalle_ventas (
    id SERIAL PRIMARY KEY,
    venta_id INT REFERENCES ventas(id),
    producto_id INT REFERENCES productos(id),
    cantidad DECIMAL(10,3) NOT NULL,             
    precio_unitario DECIMAL(10,2) NOT NULL, 
    costo_unitario DECIMAL(10,2) NOT NULL,      
    subtotal DECIMAL(10,2) NOT NULL
);

CREATE TABLE kardex_inventario (
    id SERIAL PRIMARY KEY,
    producto_id INT REFERENCES productos(id),
    tipo_movimiento VARCHAR(20) NOT NULL, 
    cantidad DECIMAL(10,3) NOT NULL,             
    referencia_id INT, 
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- INDICES 

-- 1. Índice para acelerar el Dashboard (Búsquedas rápidas por fechas)
CREATE INDEX idx_ventas_fecha ON ventas(fecha);

-- 2. Índice para calcular el stock actual en el Kardex sin que se trabe
CREATE INDEX idx_kardex_producto_id ON kardex_inventario(producto_id);

-- 3. Índice para las compras/ingresos de mercancía por fecha
CREATE INDEX idx_compras_fecha ON compras(fecha);

-- 4. Índice para cuando el cajero busque un producto tecleando el nombre en lugar de escanearlo
CREATE INDEX idx_productos_nombre ON productos(nombre);

-- 5. Índice para filtrar rápidamente las ventas de un turno específico
CREATE INDEX idx_ventas_sesion ON ventas(sesion_caja_id);