const API_PRODUCTOS_URL = 'http://localhost:3000/api/productos';
const API_VENTAS_URL = 'http://localhost:3000/api/ventas'; 

document.addEventListener('DOMContentLoaded', () => {
    cargarDatosInventario();
    cargarDatosVentas('hoy');
    inicializarFiltrosTiempo();
});

// CARGA DE INVENTARIO (Panel de Alertas)
const cargarDatosInventario = async () => {
    try {
        const respuesta = await fetchAutenticado(API_PRODUCTOS_URL);
        if (!respuesta.ok) throw new Error('Error al conectar con la base de datos de productos');

        const productos = await respuesta.json(); 
        const listaStockBajo = productos.filter(p => Number(p.stock_actual) > 0 && Number(p.stock_actual) <= 10);
        
        renderizarStockBajo(listaStockBajo);
    } catch (error) {
        console.error('Error cargando inventario:', error);
        document.getElementById('tablaStockBajo').innerHTML = '<tr><td colspan="2" style="text-align: center; color: #ef4444;">Error al cargar el stock crítico</td></tr>';
    }
};

const renderizarStockBajo = (lista) => {
    const tbody = document.getElementById('tablaStockBajo');
    document.getElementById('badgeStockBajo').textContent = lista.length;

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; color: #10b981; padding: 20px;">Todo el stock está en niveles óptimos.</td></tr>';
        return;
    }

    lista.sort((a, b) => Number(a.stock_actual) - Number(b.stock_actual));
    tbody.innerHTML = '';
    
    lista.forEach(prod => {
        const stock = Number(prod.stock_actual);
        const claseBadge = stock <= 5 ? 'badge-critico' : 'badge-medio';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${prod.nombre}</strong><br><span style="font-size: 11px; color: #94a3b8;">${(prod.codigos && prod.codigos[0]) ? prod.codigos[0] : 'S/N'}</span></td>
            <td style="text-align: right;"><span class="badge-stock ${claseBadge}">${stock}</span></td>
        `;
        tbody.appendChild(tr);
    });
};

// LÓGICA DE FILTROS DE TIEMPO Y UI
const inicializarFiltrosTiempo = () => {
    const botones = document.querySelectorAll('.btn-filtro');
    botones.forEach(btn => {
        btn.addEventListener('click', (e) => {
            botones.forEach(b => b.classList.remove('activo'));
            e.target.classList.add('activo');
            
            const textoBoton = e.target.textContent.toLowerCase();
            let rango = 'hoy';
            if (textoBoton.includes('semana')) rango = 'semana';
            if (textoBoton.includes('mes')) rango = 'mes';
            
            actualizarTextosUI(rango);
            cargarDatosVentas(rango);
        });
    });
};

const actualizarTextosUI = (rango) => {
    const textos = {
        hoy: { tituloVentas: "Ventas de Hoy", tituloGanancias: "Ganancias de Hoy", tituloGrafico: "Ingresos por Hora (Hoy)" },
        semana: { tituloVentas: "Ventas de la Semana", tituloGanancias: "Ganancias Semanales", tituloGrafico: "Ingresos Diarios (Última Semana)" },
        mes: { tituloVentas: "Ventas del Mes", tituloGanancias: "Ganancias del Mes", tituloGrafico: "Ingresos (Este Mes)" }
    };

    document.querySelector('.kpi-card.destacado h3').textContent = textos[rango].tituloVentas;
    document.querySelector('.kpi-card.capital h3').textContent = textos[rango].tituloGanancias;
    
    const tituloGrafico = document.getElementById('tituloGrafico');
    if (tituloGrafico) tituloGrafico.textContent = textos[rango].tituloGrafico;
};

// VENTAS (Métricas)
const cargarDatosVentas = async (rangoTiempo) => {
    try {
        const respuesta = await fetchAutenticado(API_VENTAS_URL);
        if (!respuesta.ok) {
            console.warn("Error en la API. Procesando interfaz vacía.");
            procesarMeticasFinancieras([], rangoTiempo);
            return;
        }
        const ventas = await respuesta.json();
        procesarMeticasFinancieras(ventas, rangoTiempo);
    } catch (error) {
        console.error('Error cargando ventas:', error);
        procesarMeticasFinancieras([], rangoTiempo);
    }
};

const procesarMeticasFinancieras = (ventas, rango) => {
    const ahora = new Date();
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
    const diaSemana = ahora.getDay(); 
    const diasParaLunes = diaSemana === 0 ? 6 : diaSemana - 1; 
    const inicioSemana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - diasParaLunes).getTime(); 
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).getTime();

    const ventasFiltradas = ventas.filter(venta => {
        const fechaVenta = new Date(venta.fecha_creacion || venta.fecha).getTime();
        if (rango === 'hoy') return fechaVenta >= inicioHoy;
        if (rango === 'semana') return fechaVenta >= inicioSemana;
        if (rango === 'mes') return fechaVenta >= inicioMes;
        return true; 
    });

    let ingresosTotales = 0;
    let utilidadNeta = 0;
    let conteoProductos = {};

    ventasFiltradas.forEach(venta => {
        ingresosTotales += Number(venta.total);
        if (venta.productos) {
            const listaProductos = typeof venta.productos === 'string' ? JSON.parse(venta.productos) : venta.productos;
            listaProductos.forEach(p => {
                if (p.id) { 
                    const gananciaPorUnidad = Number(p.precio_venta) - (Number(p.precio_compra) || 0); 
                    utilidadNeta += (gananciaPorUnidad * p.cantidad);
                    const nombre = p.nombre || `Producto #${p.id}`;
                    conteoProductos[nombre] = (conteoProductos[nombre] || 0) + p.cantidad;
                }
            });
        }
    });

    const cantidadTickets = ventasFiltradas.length;
    const ticketPromedio = cantidadTickets > 0 ? (ingresosTotales / cantidadTickets) : 0;

    let topProducto = "Sin datos";
    let topVentas = 0;
    for (const [nombre, cantidad] of Object.entries(conteoProductos)) {
        if (cantidad > topVentas) {
            topVentas = cantidad;
            topProducto = nombre;
        }
    }

    const subtextoProd = rango === 'semana' ? 'esta semana' : rango === 'mes' ? 'este mes' : 'hoy';

    document.getElementById('kpiVentasHoy').textContent = `$${ingresosTotales.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    document.getElementById('kpiVentasHoy').nextElementSibling.textContent = `${cantidadTickets} tickets emitidos`;
    document.getElementById('kpiGanancias').textContent = `$${utilidadNeta.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    document.getElementById('kpiPromedioVenta').textContent = `$${ticketPromedio.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('kpiTopProducto').textContent = topProducto;
    document.getElementById('kpiTopVentas').textContent = `${topVentas} unidades ${subtextoProd}`;

    inicializarGraficoVentas(ventasFiltradas, rango);
};


// GRÁFICA 
let graficoActual = null;

const inicializarGraficoVentas = (ventasData, rango) => {
    const ctx = document.getElementById('graficoVentas').getContext('2d');
    if (graficoActual) graficoActual.destroy();

    let etiquetas = [];
    let datosVentas = [];

    if (rango === 'hoy') {
        const ventasPorHora = {};
        for (let i = 6; i <= 23; i++) {
            ventasPorHora[`${i.toString().padStart(2, '0')}:00`] = 0;
        }
        
        ventasData.forEach(v => {
            const hora = new Date(v.fecha_creacion || v.fecha).getHours();
            if (hora >= 6 && hora <= 23) {
                const etiquetaHora = `${hora.toString().padStart(2, '0')}:00`;
                ventasPorHora[etiquetaHora] = (ventasPorHora[etiquetaHora] || 0) + Number(v.total);
            }
        });

        etiquetas = Object.keys(ventasPorHora).sort();
        datosVentas = etiquetas.map(hora => ventasPorHora[hora]);

    } else if (rango === 'semana') {
        const ahora = new Date();
        const diaSemana = ahora.getDay();
        const diasParaLunes = diaSemana === 0 ? 6 : diaSemana - 1;
        const lunes = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - diasParaLunes);

        const nombresDias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        etiquetas = [];
        datosVentas = [0, 0, 0, 0, 0, 0, 0];

        for (let i = 0; i < 7; i++) {
            const fechaDia = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + i);
            etiquetas.push(`${nombresDias[i]} ${fechaDia.getDate()}`);
        }
        
        ventasData.forEach(v => {
            const fechaVenta = new Date(v.fecha_creacion || v.fecha);
            const fechaVentaNorm = new Date(fechaVenta.getFullYear(), fechaVenta.getMonth(), fechaVenta.getDate()).getTime();
            const lunesNorm = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate()).getTime();
            
            const indiceDia = Math.round((fechaVentaNorm - lunesNorm) / (1000 * 60 * 60 * 24));
            if (indiceDia >= 0 && indiceDia < 7) {
                datosVentas[indiceDia] += Number(v.total);
            }
        });

    } else if (rango === 'mes') {
        const fechaActual = new Date();
        const mesCorto = fechaActual.toLocaleString('es-ES', { month: 'short' }).replace('.', '');
        const ultimoDia = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0).getDate();

        etiquetas = [
            `1 ${mesCorto} - 7 ${mesCorto}`, 
            `8 ${mesCorto} - 14 ${mesCorto}`, 
            `15 ${mesCorto} - 21 ${mesCorto}`, 
            `22 ${mesCorto} - ${ultimoDia} ${mesCorto}`
        ];
        datosVentas = [0, 0, 0, 0]; 
        
        ventasData.forEach(v => {
            const dia = new Date(v.fecha_creacion || v.fecha).getDate();
            if (dia <= 7) {
                datosVentas[0] += Number(v.total);
            } else if (dia <= 14) {
                datosVentas[1] += Number(v.total);
            } else if (dia <= 21) {
                datosVentas[2] += Number(v.total);
            } else {
                datosVentas[3] += Number(v.total); 
            }
        });
    } 

    // Escala dinámica
    let maxSugerido = 6000;
    let saltoEscala = 1000;

    if (rango === 'hoy') {
        maxSugerido = 3000;
        saltoEscala = 300; 
    } else if (rango === 'semana') {
        maxSugerido = 6000; 
        saltoEscala = 1000; 
    } else if (rango === 'mes') {
        maxSugerido = 30000;
        saltoEscala = 5000; 
    }

    graficoActual = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: etiquetas,
            datasets: [{
                label: 'Ingresos ($)',
                data: datosVentas,
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: '#2563eb',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { 
                y: { 
                    beginAtZero: true,
                    suggestedMax: maxSugerido, 
                    ticks: { 
                        stepSize: saltoEscala, 
                        callback: function(value) { return '$' + value; } 
                    } 
                } 
            }
        }
    });
};