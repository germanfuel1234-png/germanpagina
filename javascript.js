document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // ============================================================
    // 1. FORMULARIO DE CONTACTO
    // El formulario y sus botones (WhatsApp / Enviar) se manejan en el
    // script inline de index.html. El envío usa EmailJS (fetch en
    // segundo plano): NO abre la app de correo y redirige a
    // gracias.html tras enviar.
    // ============================================================
    const mensajeTextarea = document.getElementById('mensaje');

    // ============================================================
    // 2. SIMULADOR DE PRESUPUESTOS
    // ============================================================
    const serviceType = document.getElementById('sim-service-type');
    const projectType = document.getElementById('sim-project-type');
    const checkboxes = document.querySelectorAll('#sim-extra-seo, #sim-extra-analytics, #sim-extra-crm, #sim-extra-mantenimiento');
    const priceEl = document.getElementById('sim-price');
    const baseEl = document.getElementById('sim-base');
    const extrasEl = document.getElementById('sim-extras');
    const totalEl = document.getElementById('sim-total');
    const simCta = document.getElementById('sim-cta');

    if (serviceType && projectType) {
        const PRICES = {
            programacion: {
                'landing-replica': 100000,
                'landing-nueva': 200000,
                'one-page': 240000,
                'web-institucional': 400000,
                'web-woocommerce': 530000
            },
            diseno: {
                'landing-replica': 150000,
                'landing-nueva': 230000,
                'one-page-funnel': 350000,
                'web-institucional': 600000,
                'web-compleja': 800000
            },
            plantilla: {
                'landing-plantilla': 140000,
                'one-page-plantilla': 230000,
                'web-institucional-plantilla': 340000,
                'web-woocommerce-plantilla': 450000
            },
            apps: {
                'movil-basico': 500000,
                'movil-database': 1200000,
                'movil-compleja': 2500000,
                'escritorio-basico': 600000,
                'escritorio-profesional': 1500000
            }
        };

        const PROJECT_NAMES = {
            programacion: {
                'landing-replica': 'Landing réplica (basada en web existente)',
                'landing-nueva': 'Landing nueva',
                'one-page': 'One Page',
                'web-institucional': 'Web institucional (hasta 6 subpáginas + Home + Contacto)',
                'web-woocommerce': 'Web institucional + WooCommerce'
            },
            diseno: {
                'landing-replica': 'Landing réplica',
                'landing-nueva': 'Landing nueva',
                'one-page-funnel': 'One Page estilo Funnel (5 bloques)',
                'web-institucional': 'Web institucional (hasta 6 subpáginas + Home + Contacto)',
                'web-compleja': 'Web compleja (Tienda + Pasarela de pago + Especiales)'
            },
            plantilla: {
                'landing-plantilla': 'Landing sobre plantilla',
                'one-page-plantilla': 'One Page sobre plantilla',
                'web-institucional-plantilla': 'Web institucional sobre plantilla',
                'web-woocommerce-plantilla': 'Web institucional + WooCommerce sobre plantilla'
            },
            apps: {
                'movil-basico': 'App Móvil (Catálogo) - Desde $500.000',
                'movil-database': 'App Móvil (Login / Base de Datos) - Desde $1.200.000',
                'movil-compleja': 'App Móvil Premium (Pagos / GPS) - Desde $2.500.000',
                'escritorio-basico': 'App Escritorio (Gestión básica) - Desde $600.000',
                'escritorio-profesional': 'App Escritorio Profesional - Desde $1.500.000'
            }
        };

        const EXTRA_PERCENTS = {
            seo: 0.15,
            analytics: 0.10,
            crm: 0.12,
            mantenimiento: 0.18
        };

        const EXTRA_NAMES = {
            seo: 'Optimización SEO avanzada',
            analytics: 'Google Analytics / Tag Manager',
            crm: 'Integración con CRM',
            mantenimiento: 'Mantenimiento 3 meses'
        };

        let currentTotal = 0;
        let currentProjectName = '';

        function formatPrice(value) {
            return '$' + value.toLocaleString('es-AR');
        }

        function updateProjectOptions() {
            const service = serviceType.value;
            const projects = PRICES[service];
            const names = PROJECT_NAMES[service];

            projectType.innerHTML = '';
            Object.keys(projects).forEach(key => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = names[key];
                projectType.appendChild(option);
            });

            updatePrice();
        }

        function updatePrice() {
            const service = serviceType.value;
            const projectKey = projectType.value;
            const basePrice = PRICES[service]?.[projectKey] || 0;

            const selectedOption = projectType.options[projectType.selectedIndex];
            currentProjectName = selectedOption ? selectedOption.textContent : '';

            let extraTotal = 0;
            let extrasList = [];
            checkboxes.forEach(cb => {
                if (cb.checked) {
                    const percent = EXTRA_PERCENTS[cb.value] || 0;
                    const extra = Math.round(basePrice * percent);
                    extraTotal += extra;
                    extrasList.push(EXTRA_NAMES[cb.value]);
                }
            });

            currentTotal = basePrice + extraTotal;

            priceEl.textContent = formatPrice(currentTotal);
            baseEl.textContent = formatPrice(basePrice);
            extrasEl.textContent = extraTotal > 0 ? formatPrice(extraTotal) : '$0';
            totalEl.textContent = formatPrice(currentTotal);

            // ============================================================
            // Configurar el botón "Solicitar presupuesto"
            // ============================================================
            if (simCta) {
                simCta.setAttribute('data-proyecto', currentProjectName);
                simCta.setAttribute('data-total', currentTotal);
                // Eliminar eventos previos para evitar duplicados
                simCta.removeEventListener('click', handleSimCtaClick);
                simCta.addEventListener('click', handleSimCtaClick);
            }
        }

        // ============================================================
        // Función que maneja el clic del botón "Solicitar presupuesto"
        // ============================================================
        function handleSimCtaClick(e) {
            e.preventDefault();

            const proyecto = this.getAttribute('data-proyecto') || 'Proyecto sin nombre';
            const total = this.getAttribute('data-total') || '0';

            // Llenar el campo de mensaje
            if (mensajeTextarea) {
                mensajeTextarea.value = `Me interesa el siguiente proyecto:\n${proyecto}\nPresupuesto estimado: $${Number(total).toLocaleString('es-AR')}`;
            }

            // Hacer scroll a la sección de contacto
            const contactoSection = document.getElementById('contacto');
            if (contactoSection) {
                contactoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            // Campo oculto para el presupuesto (opcional)
            const presupuestoInput = document.getElementById('presupuesto-input');
            if (presupuestoInput) {
                presupuestoInput.value = `${proyecto} - $${Number(total).toLocaleString('es-AR')}`;
            }

            // Enfocar el primer campo del formulario
            const primerCampo = document.querySelector('#contacto input, #contacto textarea');
            if (primerCampo) {
                setTimeout(() => primerCampo.focus(), 600);
            }
        }

        // Event listeners del simulador
        serviceType.addEventListener('change', updateProjectOptions);
        projectType.addEventListener('change', updatePrice);
        checkboxes.forEach(cb => cb.addEventListener('change', updatePrice));

        // Inicializar simulador
        updateProjectOptions();
    }

    // ============================================================
    // 3. RECIBIR PRESUPUESTO DESDE LA URL
    // ============================================================
    function getParamsFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const presupuesto = params.get('presupuesto');
        const total = params.get('total');
        if (presupuesto && mensajeTextarea) {
            setTimeout(() => {
                if (mensajeTextarea.value.trim() === '') {
                    mensajeTextarea.value = `Me interesa el siguiente proyecto:\n${decodeURIComponent(presupuesto)}\nPresupuesto estimado: ${total ? '$' + total : ''}`;
                }
            }, 500);
        }
    }
    getParamsFromUrl();
});
