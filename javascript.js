document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // ============================================================
    // 1. FORMULARIO DE CONTACTO
    // ============================================================
    const nombreInput = document.getElementById('nombre');
    const correoInput = document.getElementById('correo');
    const servicioSelect = document.getElementById('servicio');
    const empresaInput = document.getElementById('empresa');
    const whatsappInput = document.getElementById('whatsapp');
    const mensajeTextarea = document.getElementById('mensaje');
    const btnWhatsapp = document.getElementById('btn-whatsapp');
    const btnGmail = document.getElementById('btn-gmail');
    const successMessage = document.getElementById('form-success');

    if (btnWhatsapp && btnGmail) {
        // Función para validar el formulario
        function validarFormulario() {
            let isValid = true;
            
            // Validar nombre
            if (!nombreInput.value.trim()) {
                const errorNombre = nombreInput.parentElement.querySelector('.field-error');
                if (errorNombre) errorNombre.style.display = 'block';
                nombreInput.style.borderColor = 'red';
                isValid = false;
            } else {
                const errorNombre = nombreInput.parentElement.querySelector('.field-error');
                if (errorNombre) errorNombre.style.display = 'none';
                nombreInput.style.borderColor = '';
            }
            
            // Validar correo
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!correoInput.value.trim() || !emailRegex.test(correoInput.value)) {
                const errorCorreo = correoInput.parentElement.querySelector('.field-error');
                if (errorCorreo) errorCorreo.style.display = 'block';
                correoInput.style.borderColor = 'red';
                isValid = false;
            } else {
                const errorCorreo = correoInput.parentElement.querySelector('.field-error');
                if (errorCorreo) errorCorreo.style.display = 'none';
                correoInput.style.borderColor = '';
            }
            
            return isValid;
        }

        // Función para obtener los datos del formulario
        function obtenerDatos() {
            const contactoSeleccionado = [];
            document.querySelectorAll('input[name="contacto"]:checked').forEach(cb => {
                contactoSeleccionado.push(cb.value);
            });

            return {
                nombre: nombreInput.value.trim(),
                correo: correoInput.value.trim(),
                servicio: servicioSelect.value,
                empresa: empresaInput.value.trim(),
                whatsapp: whatsappInput.value.trim(),
                mensaje: mensajeTextarea.value.trim(),
                contacto: contactoSeleccionado
            };
        }

        // Función para mostrar mensaje de éxito
        function mostrarExito() {
            successMessage.style.display = 'block';
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 5000);
        }

        // BOTÓN 1: Enviar por WhatsApp
        btnWhatsapp.addEventListener('click', function() {
            if (!validarFormulario()) return;

            const datos = obtenerDatos();
            
            let mensaje = `*Nuevo mensaje de contacto*\n\n`;
            mensaje += `*Nombre:* ${datos.nombre}\n`;
            mensaje += `*Correo:* ${datos.correo}\n`;
            if (datos.empresa) mensaje += `*Empresa:* ${datos.empresa}\n`;
            if (datos.whatsapp) mensaje += `*Teléfono:* ${datos.whatsapp}\n`;
            mensaje += `*Servicio:* ${servicioSelect.options[servicioSelect.selectedIndex].text}\n`;
            if (datos.contacto.length > 0) {
                mensaje += `*Contacto preferido:* ${datos.contacto.join(', ')}\n`;
            }
            if (datos.mensaje) mensaje += `\n*Mensaje:*\n${datos.mensaje}`;

            const numeroWhatsApp = '5491136239969';
            window.open(`https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`, '_blank');
            mostrarExito();
        });

        // BOTÓN 2: Enviar por Gmail
        btnGmail.addEventListener('click', function() {
            if (!validarFormulario()) return;

            const datos = obtenerDatos();
            
            const asunto = `Contacto desde el sitio web - ${datos.nombre}`;
            let cuerpo = `Nuevo mensaje de contacto:\n\n`;
            cuerpo += `Nombre: ${datos.nombre}\n`;
            cuerpo += `Correo: ${datos.correo}\n`;
            if (datos.empresa) cuerpo += `Empresa: ${datos.empresa}\n`;
            if (datos.whatsapp) cuerpo += `Teléfono: ${datos.whatsapp}\n`;
            cuerpo += `Servicio: ${servicioSelect.options[servicioSelect.selectedIndex].text}\n`;
            if (datos.contacto.length > 0) {
                cuerpo += `Contacto preferido: ${datos.contacto.join(', ')}\n`;
            }
            if (datos.mensaje) cuerpo += `\nMensaje:\n${datos.mensaje}`;

            const correoDestino = 'germanty123@gmail.com';
            window.open(
                `https://mail.google.com/mail/?view=cm&fs=1&to=${correoDestino}&su=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`,
                '_blank'
            );
            mostrarExito();
        });

        // Prevenir envío por defecto del formulario
        document.getElementById('form-contacto').addEventListener('submit', function(e) {
            e.preventDefault();
        });

        // Ocultar errores cuando el usuario escribe
        nombreInput.addEventListener('input', function() {
            if (this.value.trim()) {
                const error = this.parentElement.querySelector('.field-error');
                if (error) error.style.display = 'none';
                this.style.borderColor = '';
            }
        });

        correoInput.addEventListener('input', function() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (this.value.trim() && emailRegex.test(this.value)) {
                const error = this.parentElement.querySelector('.field-error');
                if (error) error.style.display = 'none';
                this.style.borderColor = '';
            }
        });
    }

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
            // 👇 AGREGADO: Aplicaciones Móviles y Escritorio 👇
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
            // 👇 AGREGADO: Nombres para Apps con el precio "Desde" 👇
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

            // Obtener nombre del proyecto seleccionado
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

            // Actualizar el enlace del botón "Solicitar presupuesto"
            if (simCta) {
                const mensaje = `Hola, estoy interesado en el siguiente proyecto:\n\n`;
                const proyecto = `Proyecto: ${currentProjectName}\n`;
                const totalTexto = `Presupuesto estimado: ${formatPrice(currentTotal)}\n\n`;
                const extrasTexto = extrasList.length > 0 ? `Extras seleccionados: ${extrasList.join(', ')}\n` : '';
                const cuerpo = encodeURIComponent(mensaje + proyecto + extrasTexto + totalTexto + '\nMe gustaría recibir más información.');
                simCta.href = `#contacto?presupuesto=${encodeURIComponent(currentProjectName)}&total=${currentTotal}`;
                
                // También podemos agregar un tooltip o data attribute
                simCta.setAttribute('data-proyecto', currentProjectName);
                simCta.setAttribute('data-total', currentTotal);
            }
        }

        // Event listeners del simulador
        serviceType.addEventListener('change', updateProjectOptions);
        projectType.addEventListener('change', updatePrice);
        checkboxes.forEach(cb => cb.addEventListener('change', updatePrice));

        // Inicializar simulador
        updateProjectOptions();

        // Al hacer clic en "Solicitar presupuesto", si hay un campo oculto en el formulario, lo llenamos
        if (simCta) {
            simCta.addEventListener('click', function(e) {
                // Si el formulario tiene un campo oculto para el presupuesto, lo llenamos
                const presupuestoInput = document.getElementById('presupuesto-input');
                if (presupuestoInput) {
                    presupuestoInput.value = `${currentProjectName} - ${formatPrice(currentTotal)}`;
                }

                // También podemos llenar el campo de mensaje con el presupuesto
                if (mensajeTextarea && mensajeTextarea.value.trim() === '') {
                    mensajeTextarea.value = `Me interesa el siguiente proyecto:\n${currentProjectName}\nPresupuesto estimado: ${formatPrice(currentTotal)}`;
                }
            });
        }
    }

    // ============================================================
    // 3. RECIBIR PRESUPUESTO DESDE LA URL (si viene de "Solicitar presupuesto")
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