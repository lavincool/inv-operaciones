import flet as ft

# Importar modelos solo cuando se necesiten para evitar problemas
class MenuPrincipalColas(ft.Container):
    """
    MENU PRINCIPAL DEL SISTEMA DE COLAS
    Proporciona navegacion entre los cuatro modelos de colas disponibles
    """
    
    def __init__(self, page):
        super().__init__()
        self.page = page
        self.build_ui()
    
    def build_ui(self):
        # Interfaz principal con tarjetas para cada modelo
        self.content = ft.Column(
            [
                # Titulo principal del sistema
                ft.Container(
                    content=ft.Column([
                        ft.Text("SISTEMA DE ANALISIS DE COLAS", 
                               size=28, 
                               weight=ft.FontWeight.BOLD,
                               color=ft.Colors.BLUE_900),
                        
                        ft.Text("Modelos de Espera Probabilisticos", 
                               size=16,
                               color=ft.Colors.GREY_700),
                    ], horizontal_alignment=ft.CrossAxisAlignment.CENTER),
                    padding=20,
                    alignment=ft.alignment.center
                ),
                
                ft.Container(height=20),
                
                # Tarjetas de modelos - organizadas en fila
                ft.Row([
                    # MODELO M/M/1
                    ft.Container(
                        content=ft.Column([
                            ft.Icon(ft.Icons.SPEED, size=40, color=ft.Colors.BLUE_400),
                            ft.Text("M/M/1", size=18, weight=ft.FontWeight.BOLD),
                            ft.Text("Cola Simple con un Servidor", size=12),
                            ft.Container(
                                content=ft.Column([
                                    ft.Text("• Un servidor", size=10),
                                    ft.Text("• Capacidad infinita", size=10),
                                    ft.Text("• Llegadas Poisson", size=10),
                                    ft.Text("• Servicio exponencial", size=10),
                                ], spacing=2),
                                padding=ft.padding.only(top=5, bottom=10)
                            ),
                            ft.ElevatedButton(
                                "Abrir Modelo",
                                on_click=lambda _: self.abrir_modelo("mm1"),
                                style=ft.ButtonStyle(
                                    bgcolor=ft.Colors.BLUE_100,
                                    color=ft.Colors.BLUE_800
                                )
                            )
                        ], horizontal_alignment=ft.CrossAxisAlignment.CENTER),
                        padding=20,
                        bgcolor=ft.Colors.BLUE_50,
                        border_radius=10,
                        width=280,
                        height=250
                    ),
                    
                    # MODELO M/C/1
                    ft.Container(
                        content=ft.Column([
                            ft.Icon(ft.Icons.TIMER, size=40, color=ft.Colors.ORANGE_400),
                            ft.Text("M/C/1", size=18, weight=ft.FontWeight.BOLD),
                            ft.Text("Cola con Servicio Constante", size=12),
                            ft.Container(
                                content=ft.Column([
                                    ft.Text("• Un servidor", size=10),
                                    ft.Text("• Capacidad infinita", size=10),
                                    ft.Text("• Llegadas Poisson", size=10),
                                    ft.Text("• Servicio constante", size=10),
                                ], spacing=2),
                                padding=ft.padding.only(top=5, bottom=10)
                            ),
                            ft.ElevatedButton(
                                "Abrir Modelo",
                                on_click=lambda _: self.abrir_modelo("mc1"),
                                style=ft.ButtonStyle(
                                    bgcolor=ft.Colors.ORANGE_100,
                                    color=ft.Colors.ORANGE_800
                                )
                            )
                        ], horizontal_alignment=ft.CrossAxisAlignment.CENTER),
                        padding=20,
                        bgcolor=ft.Colors.ORANGE_50,
                        border_radius=10,
                        width=280,
                        height=250
                    ),
                    
                    # MODELO M/M/1/N
                    ft.Container(
                        content=ft.Column([
                            ft.Icon(ft.Icons.BUSINESS_CENTER, size=40, color=ft.Colors.GREEN_400),
                            ft.Text("M/M/1/N", size=18, weight=ft.FontWeight.BOLD),
                            ft.Text("Cola con Capacidad Limitada", size=12),
                            ft.Container(
                                content=ft.Column([
                                    ft.Text("• Un servidor", size=10),
                                    ft.Text("• Capacidad maxima N", size=10),
                                    ft.Text("• Llegadas Poisson", size=10),
                                    ft.Text("• Clientes rechazados", size=10),
                                ], spacing=2),
                                padding=ft.padding.only(top=5, bottom=10)
                            ),
                            ft.ElevatedButton(
                                "Abrir Modelo",
                                on_click=lambda _: self.abrir_modelo("mm1n"),
                                style=ft.ButtonStyle(
                                    bgcolor=ft.Colors.GREEN_100,
                                    color=ft.Colors.GREEN_800
                                )
                            )
                        ], horizontal_alignment=ft.CrossAxisAlignment.CENTER),
                        padding=20,
                        bgcolor=ft.Colors.GREEN_50,
                        border_radius=10,
                        width=280,
                        height=250
                    ),
                    
                    # MODELO M/M/S
                    ft.Container(
                        content=ft.Column([
                            ft.Icon(ft.Icons.GROUP, size=40, color=ft.Colors.PURPLE_400),
                            ft.Text("M/M/S", size=18, weight=ft.FontWeight.BOLD),
                            ft.Text("Cola con Multiples Servidores", size=12),
                            ft.Container(
                                content=ft.Column([
                                    ft.Text("• S servidores", size=10),
                                    ft.Text("• Una sola fila", size=10),
                                    ft.Text("• Llegadas Poisson", size=10),
                                    ft.Text("• Servidor disponible", size=10),
                                ], spacing=2),
                                padding=ft.padding.only(top=5, bottom=10)
                            ),
                            ft.ElevatedButton(
                                "Abrir Modelo",
                                on_click=lambda _: self.abrir_modelo("mms"),
                                style=ft.ButtonStyle(
                                    bgcolor=ft.Colors.PURPLE_100,
                                    color=ft.Colors.PURPLE_800
                                )
                            )
                        ], horizontal_alignment=ft.CrossAxisAlignment.CENTER),
                        padding=20,
                        bgcolor=ft.Colors.PURPLE_50,
                        border_radius=10,
                        width=280,
                        height=250
                    )
                ], spacing=10, scroll=ft.ScrollMode.ADAPTIVE),
                
                ft.Container(height=30),
                
                # Informacion del sistema
                ft.Container(
                    content=ft.Text("Unidad 5: Lineas de Espera - Investigacion de Operaciones", 
                           size=12, 
                           color=ft.Colors.GREY_500),
                    alignment=ft.alignment.center,
                    padding=10
                )
            ],
            scroll=ft.ScrollMode.ADAPTIVE,
            expand=True,
            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            spacing=0
        )
    
    def abrir_modelo(self, modelo):
        """
        METODO PARA CAMBIAR ENTRE MODELOS
        Limpia la pagina actual y carga la interfaz del modelo seleccionado
        """
        try:
            self.page.clean()
            
            if modelo == "mm1":
                from cola_simple import ColaSimpleServidor
                instancia = ColaSimpleServidor(self.page)
            elif modelo == "mc1":
                from cola_servicio_constante import ColaServicioConstante
                instancia = ColaServicioConstante(self.page)
            elif modelo == "mm1n":
                from cola_capacidad_limitada import ColaCapacidadLimitada
                instancia = ColaCapacidadLimitada(self.page)
            elif modelo == "mms":
                from cola_multiples_servidores import ColaMultiplesServidores
                instancia = ColaMultiplesServidores(self.page)
            else:
                return
            
            self.page.add(instancia)
            self.page.update()
            
        except ImportError as e:
            self.page.add(ft.Text(f"Error al cargar el modelo: {str(e)}", color=ft.Colors.RED))
            self.page.update()
        except Exception as e:
            self.page.add(ft.Text(f"Error inesperado: {str(e)}", color=ft.Colors.RED))
            self.page.update()