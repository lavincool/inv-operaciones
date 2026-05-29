import math
import flet as ft
import formulario

class Modelo_probabilistico(ft.Container):
    """
    MODELO PROBABILÍSTICO
    Gestión de inventarios con stock de seguridad
    """
    
    def __init__(self, page):
        super().__init__()
        self.page = page
        self.bgcolor = ft.Colors.BLUE_GREY_50
        self.expand = True

        # CAMPOS DE ENTRADA
        self.demanda_field = ft.TextField(
            label="Demanda Promedio (μ)", 
            width=200
        )
        self.varianza_field = ft.TextField(
            label="Varianza (σ²)", 
            width=200
        )
        self.z_field = ft.TextField(
            label="Valor Z", 
            width=200
        )
        self.costo_pedido_field = ft.TextField(
            label="Costo Pedido (S)", 
            width=200
        )
        self.costo_mantenimiento_field = ft.TextField(
            label="Costo Mantenimiento (H)", 
            width=200
        )
        self.lead_time_field = ft.TextField(
            label="Tiempo Entrega (L) días", 
            width=200
        )

        # RESULTADOS
        self.q_result = ft.Text("0.00", size=18, weight=ft.FontWeight.BOLD, color=ft.Colors.PURPLE_700)
        self.pr_result = ft.Text("0.00", size=18, weight=ft.FontWeight.BOLD, color=ft.Colors.PURPLE_700)
        self.ss_result = ft.Text("0.00", size=14, weight=ft.FontWeight.BOLD, color=ft.Colors.GREEN_700)

        self.build_ui()

    def build_ui(self):
        """INTERFAZ CON SCROLL"""
        self.content = ft.Column(
            [
                # ENCABEZADO
                ft.Container(
                    content=ft.Row([
                        ft.Text("MODELO PROBABILÍSTICO", 
                               size=20, 
                               weight=ft.FontWeight.BOLD, 
                               color=ft.Colors.PURPLE_700),
                        ft.IconButton(
                            icon=ft.Icons.ARROW_BACK, 
                            icon_color=ft.Colors.PURPLE_700,
                            on_click=self.volver_menu
                        )
                    ]),
                    padding=15,
                    bgcolor=ft.Colors.PURPLE_50
                ),
                
                # PANEL DE PARÁMETROS
                ft.Card(
                    content=ft.Container(
                        content=ft.Column([
                            ft.Text("Parámetros del Sistema", 
                                   size=16, 
                                   weight=ft.FontWeight.BOLD),
                            
                            ft.ResponsiveRow([
                                ft.Column([self.demanda_field], col=6),
                                ft.Column([self.varianza_field], col=6),
                            ]),
                            
                            ft.ResponsiveRow([
                                ft.Column([self.z_field], col=6),
                                ft.Column([self.costo_pedido_field], col=6),
                            ]),
                            
                            ft.ResponsiveRow([
                                ft.Column([self.costo_mantenimiento_field], col=6),
                                ft.Column([self.lead_time_field], col=6),
                            ]),
                            
                            # INFORMACIÓN SOBRE VALORES Z
                            ft.Container(
                                content=ft.Column([
                                    ft.Text("Valores Z comunes:", size=12, weight=ft.FontWeight.BOLD),
                                    ft.Text("95% → Z=1.65, 90% → Z=1.28, 99% → Z=2.33", 
                                           size=10, 
                                           color=ft.Colors.GREY_600),
                                ]),
                                padding=10,
                                bgcolor=ft.Colors.PURPLE_100,
                                border_radius=8
                            ),
                            
                            # BOTÓN DE CÁLCULO
                            ft.Container(
                                content=ft.ElevatedButton(
                                    "CALCULAR MODELO",
                                    on_click=self.calcular,
                                    style=ft.ButtonStyle(
                                        bgcolor=ft.Colors.PURPLE_400,
                                        color=ft.Colors.WHITE,
                                        padding=20
                                    ),
                                    icon=ft.Icons.SECURITY
                                ),
                                padding=20,
                                alignment=ft.alignment.center
                            )
                        ], spacing=15),
                        padding=20
                    ),
                    margin=10
                ),
                
                # PANEL DE RESULTADOS
                ft.Card(
                    content=ft.Container(
                        content=ft.Column([
                            ft.Text("Resultados del Modelo", 
                                   size=16, 
                                   weight=ft.FontWeight.BOLD),
                            
                            ft.Container(
                                content=ft.Column([
                                    ft.Row([
                                        ft.Text("Lote Económico (Q):", 
                                               size=14,
                                               weight=ft.FontWeight.W_500),
                                        self.q_result
                                    ]),
                                    ft.Row([
                                        ft.Text("Punto de Reorden (PR):", 
                                               size=14,
                                               weight=ft.FontWeight.W_500),
                                        self.pr_result
                                    ]),
                                    ft.Container(
                                        content=ft.Column([
                                            ft.Row([
                                                ft.Text("Stock de Seguridad:", 
                                                       size=14,
                                                       weight=ft.FontWeight.W_500),
                                                self.ss_result
                                            ]),
                                        ]),
                                        padding=10,
                                        bgcolor=ft.Colors.GREEN_50,
                                        border_radius=8
                                    )
                                ], spacing=15),
                                padding=20
                            )
                        ]),
                        padding=20
                    ),
                    margin=10
                ),
                
                # ESPACIO FINAL
                ft.Container(height=50)
            ],
            scroll=ft.ScrollMode.ADAPTIVE,
            expand=True
        )

    def calcular(self, e):
        """MÉTODO DE CÁLCULO"""
        try:
            # VALIDAR ENTRADAS
            D = formulario.validar_entrada(self.demanda_field.value, "Demanda", 1)
            varianza = formulario.validar_entrada(self.varianza_field.value, "Varianza", 0)
            Z = formulario.validar_entrada(self.z_field.value, "Valor Z", 0)
            S = formulario.validar_entrada(self.costo_pedido_field.value, "Costo pedido", 0.01)
            H = formulario.validar_entrada(self.costo_mantenimiento_field.value, "Costo mantenimiento", 0.01)
            L = formulario.validar_entrada(self.lead_time_field.value, "Tiempo entrega", 0.1)

            # REALIZAR CÁLCULOS
            Q = formulario.Q(D, S, H, 0, 1)  # Modelo 1 = EOQ básico
            
            # Calcular punto de reorden con stock seguridad
            demanda_promedio_diaria = D / 365
            demanda_lead_time = demanda_promedio_diaria * L
            desviacion = math.sqrt(varianza * L / 365)  # Varianza por día
            stock_seguridad = Z * desviacion
            PR = demanda_lead_time + stock_seguridad

            # ACTUALIZAR RESULTADOS
            self.q_result.value = f"{Q:.2f}"
            self.pr_result.value = f"{PR:.2f}"
            self.ss_result.value = f"{stock_seguridad:.2f}"
            self.update()
            
        except ValueError as ve:
            self.mostrar_error(str(ve))

    def mostrar_error(self, mensaje):
        """MÉTODO CORREGIDO para mostrar errores en Flet"""
        self.page.snack_bar = ft.SnackBar(
            content=ft.Text(mensaje),
            duration=3000
        )
        self.page.snack_bar.open = True
        self.page.update()

    def volver_menu(self, e):
        from menu_principal import Menu_principal
        self.page.clean()
        menu = Menu_principal(self.page)
        self.page.add(menu)
        self.page.update()