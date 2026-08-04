# SysRT - Sistema de Punto de Venta

Sistema de punto de venta y control de inventario en desarrollo, diseñado para optimizar el flujo de trabajo, las ventas a granel y la administración diaria de una tienda física.

## Estado del Proyecto
Actualmente en fase de inicialización. Se está definiendo la arquitectura de datos y la configuración del entorno.

##  Características principales (En progreso)
- [x] Diseño estructural de la base de datos (Esquema principal).
- [ ] Módulo de control de usuarios y roles.
- [ ] Gestión de inventario (Kardex) y control de stock.
- [ ] Registro de ventas y detalles de tickets.
- [ ] Control de caja y turnos.

## Base de Datos
El script de inicialización de la base de datos se encuentra en el archivo `schema_SysRT.sql`. Este archivo contiene:
- Tablas principales para la gestión de productos, categorías y códigos de barras.
- Estructura para el registro de ventas, compras y el Kardex de inventario.
- Índices optimizados para la búsqueda rápida en el punto de venta.

## Próximos pasos
- Levantar el servidor backend.
- Conectar la base de datos con el ORM / gestor de consultas.
- Crear las primeras rutas y controladores para el inventario.