import flet as ft
import formulario

class Modelo_escases(ft.Container):
    """
    MODELO CON ESCASEZ PERMITIDA
    Balance óptimo de costos considerando faltantes
    """
    
    def __init__(self, page):
        super().__init__()
        self.page = page
        self.bgcolor = ft.Colors.BLUE_GREY_50
        self.expand = True

        # CAMPOS DE ENTRADA
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
        self.costo_escasez_field = ft.TextField(
            label="Costo Escasez (Ca)", 
            width=200
        )

        # RESULTADOS
        self.q_result = ft.Text("0.00", size=18, weight=ft.FontWeight.BOLD, color=ft.Colors.RED_700)
        self.sm_result = ft.Text("0.00", size=18, weight=ft.FontWeight.BOLD, color=ft.Colors.RED_700)
        self.cta_result = ft.Text("0.00", size=18, weight=ft.FontWeight.BOLD, color=ft.Colors.RED_700)

        self.build_ui()

    def build_ui(self):
        """INTERFAZ CON SCROLL"""
        self.content = ft.Column(
            [
                # ENCABEZADO
                ft.Container(
                    content=ft.Row([
                        ft.Text("MODELO CON ESCASEZ", 
                               size=20, 
                               weight=ft.FontWeight.BOLD, 
                               color=ft.Colors.RED_700),
                        ft.IconButton(
                            icon=ft.Icons.ARROW_BACK, 
                            icon_color=ft.Colors.RED_700,
                            on_click=self.volver_menu
                        )
                    ]),
                    padding=15,
                    bgcolor=ft.Colors.RED_50
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
                                ft.Column([self.costo_pedido_field], col=6),
                            ]),
                            
                            ft.ResponsiveRow([
                                ft.Column([self.costo_mantenimiento_field], col=6),
                                ft.Column([self.costo_escasez_field], col=6),
                            ]),
                            
                            # INFORMACIÓN ADICIONAL
                            ft.Container(
                                content=ft.Column([
                                    ft.Text("Recomendación:", size=12, weight=ft.FontWeight.BOLD),
                                    ft.Text("Use cuando el costo de escasez sea menor que el costo de mantenimiento", 
                                           size=10, 
                                           color=ft.Colors.GREY_600),
                                ]),
                                padding=10,
                                bgcolor=ft.Colors.ORANGE_100,
                                border_radius=8
                            ),
                            
                            # BOTÓN DE CÁLCULO
                            ft.Container(
                                content=ft.ElevatedButton(
                                    "CALCULAR MODELO",
                                    on_click=self.calcular,
                                    style=ft.ButtonStyle(
                                        bgcolor=ft.Colors.RED_400,
                                        color=ft.Colors.WHITE,
                                        padding=20
                                    ),
                                    icon=ft.Icons.CALCULATE
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
                                        ft.Text("Lote con Escasez (Q):", 
                                               size=14,
                                               weight=ft.FontWeight.W_500),
                                        self.q_result
                                    ]),
                                    ft.Row([
                                        ft.Text("Inventario Máximo (Sm):", 
                                               size=14,
                                               weight=ft.FontWeight.W_500),
                                        self.sm_result
                                    ]),
                                    ft.Row([
                                        ft.Text("Costo Total Anual (CTA):", 
                                               size=14,
                                               weight=ft.FontWeight.W_500),
                                        self.cta_result
                                    ]),
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
        """MÉTODO DE CÁLCULO CORREGIDO"""
        try:
            # VALIDAR ENTRADAS
            D = formulario.validar_entrada(self.demanda_field.value, "Demanda", 1)
            S = formulario.validar_entrada(self.costo_pedido_field.value, "Costo pedido", 0.01)
            H = formulario.validar_entrada(self.costo_mantenimiento_field.value, "Costo mantenimiento", 0.01)
            Ca = formulario.validar_entrada(self.costo_escasez_field.value, "Costo escasez", 0.01)

            # REALIZAR CÁLCULOS
            Q = formulario.Q(D, S, H, Ca, 2)  # Modelo 2 = Con escasez
            Sm = formulario.Sm(Q, D, S, H, Ca, 1)  # Ahora pasamos todos los parámetros en orden correcto
            CTA = formulario.calcular_CTA(D, Q, S, H, 2, a=Ca, Sm_val=Sm)

            # ACTUALIZAR RESULTADOS
            self.q_result.value = f"{Q:.2f}"
            self.sm_result.value = f"{Sm:.2f}"
            self.cta_result.value = f"${CTA:.2f}"
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