import flet as ft
import formulario

class Modelo_descuento(ft.Container):
    """
    MODELO CON DESCUENTOS POR CANTIDAD
    Análisis de múltiples niveles de precio
    """
    
    def __init__(self, page):
        super().__init__()
        self.page = page
        self.bgcolor = ft.Colors.BLUE_GREY_50
        self.expand = True

        # CAMPOS BÁSICOS
        self.demanda_field = ft.TextField(
            label="Demanda Anual (D)", 
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

        # NIVELES DE PRECIO
        self.precio1_field = ft.TextField(
            label="Precio Nivel 1 (C1)", 
            width=200
        )
        self.precio2_field = ft.TextField(
            label="Precio Nivel 2 (C2)", 
            width=200
        )
        self.q_min_field = ft.TextField(
            label="Cantidad Mínima (Qmin)", 
            width=200
        )

        # RESULTADOS
        self.q_resultado = ft.Text("0.00", size=18, weight=ft.FontWeight.BOLD, color=ft.Colors.ORANGE_700)
        self.decision_resultado = ft.Text("", size=16, weight=ft.FontWeight.BOLD, color=ft.Colors.GREEN_700)

        self.build_ui()

    def build_ui(self):
        """INTERFAZ CON SCROLL"""
        self.content = ft.Column(
            [
                # ENCABEZADO
                ft.Container(
                    content=ft.Row([
                        ft.Text("MODELO CON DESCUENTOS", 
                               size=20, 
                               weight=ft.FontWeight.BOLD, 
                               color=ft.Colors.ORANGE_700),
                        ft.IconButton(
                            icon=ft.Icons.ARROW_BACK, 
                            icon_color=ft.Colors.ORANGE_700,
                            on_click=self.volver_menu
                        )
                    ]),
                    padding=15,
                    bgcolor=ft.Colors.ORANGE_50
                ),
                
                # PANEL DE PARÁMETROS BÁSICOS
                ft.Card(
                    content=ft.Container(
                        content=ft.Column([
                            ft.Text("Parámetros Básicos", 
                                   size=16, 
                                   weight=ft.FontWeight.BOLD),
                            
                            ft.ResponsiveRow([
                                ft.Column([self.demanda_field], col=6),
                                ft.Column([self.costo_pedido_field], col=6),
                            ]),
                            
                            ft.ResponsiveRow([
                                ft.Column([self.costo_mantenimiento_field], col=6),
                            ])
                        ], spacing=15),
                        padding=20
                    ),
                    margin=10
                ),
                
                # PANEL DE PRECIOS Y DESCUENTOS
                ft.Card(
                    content=ft.Container(
                        content=ft.Column([
                            ft.Text("Precios y Descuentos", 
                                   size=16, 
                                   weight=ft.FontWeight.BOLD),
                            
                            ft.ResponsiveRow([
                                ft.Column([self.precio1_field], col=6),
                                ft.Column([self.precio2_field], col=6),
                            ]),
                            
                            ft.ResponsiveRow([
                                ft.Column([self.q_min_field], col=6),
                            ]),
                            
                            # BOTÓN DE CÁLCULO
                            ft.Container(
                                content=ft.ElevatedButton(
                                    "CALCULAR DECISIÓN",
                                    on_click=self.calcular,
                                    style=ft.ButtonStyle(
                                        bgcolor=ft.Colors.ORANGE_400,
                                        color=ft.Colors.WHITE,
                                        padding=20
                                    ),
                                    icon=ft.Icons.TRENDING_UP
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
                            ft.Text("Resultados y Decisión", 
                                   size=16, 
                                   weight=ft.FontWeight.BOLD),
                            
                            ft.Container(
                                content=ft.Column([
                                    ft.Row([
                                        ft.Text("Lote Económico Base (Q):", 
                                               size=14,
                                               weight=ft.FontWeight.W_500),
                                        self.q_resultado
                                    ]),
                                    ft.Container(
                                        content=ft.Column([
                                            ft.Text("Decisión Óptima:", 
                                                   size=14,
                                                   weight=ft.FontWeight.W_500),
                                            self.decision_resultado
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
            S = formulario.validar_entrada(self.costo_pedido_field.value, "Costo pedido", 0.01)
            H = formulario.validar_entrada(self.costo_mantenimiento_field.value, "Costo mantenimiento", 0.01)
            C1 = formulario.validar_entrada(self.precio1_field.value, "Precio nivel 1", 0.01)
            C2 = formulario.validar_entrada(self.precio2_field.value, "Precio nivel 2", 0.01)
            q_min = formulario.validar_entrada(self.q_min_field.value, "Cantidad mínima", 1)

            # CÁLCULO Q BASE
            Q_base = formulario.Q(D, S, H, 0, 1)
            self.q_resultado.value = f"{Q_base:.2f}"

            # CALCULAR COSTOS TOTALES
            CT_sin = (D / Q_base) * S + H * (Q_base / 2) + C1 * D
            CT_con = (D / q_min) * S + H * (q_min / 2) + C2 * D

            # TOMAR DECISIÓN
            if CT_con < CT_sin:
                decision = f"✓ CON descuento: Pedir {q_min} unidades a ${C2}"
                color = ft.Colors.GREEN_700
            else:
                decision = f"✓ SIN descuento: Pedir {Q_base:.0f} unidades a ${C1}"
                color = ft.Colors.BLUE_700

            self.decision_resultado.value = decision
            self.decision_resultado.color = color
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