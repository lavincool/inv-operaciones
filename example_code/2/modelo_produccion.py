import flet as ft
import formulario

class Modelo_produccion(ft.Container):
    """
    MODELO DE PRODUCCIÓN INTERNA
    Lote económico de producción con tasa finita
    """
    
    def __init__(self, page):
        super().__init__()
        self.page = page
        self.bgcolor = ft.Colors.BLUE_GREY_50
        self.expand = True

        # CAMPOS DE ENTRADA
        self.s_field = ft.TextField(
            label="Costo Preparación (S)", 
            width=200
        )
        self.d_field = ft.TextField(
            label="Demanda Anual (D)", 
            width=200
        )
        self.h_field = ft.TextField(
            label="Costo Mantenimiento (H)", 
            width=200
        )
        self.a_field = ft.TextField(
            label="Tasa Producción (a)", 
            width=200
        )

        # RESULTADOS
        self.q_resultado = ft.Text("0.00", size=18, weight=ft.FontWeight.BOLD, color=ft.Colors.GREEN_700)
        self.sm_resultado = ft.Text("0.00", size=18, weight=ft.FontWeight.BOLD, color=ft.Colors.GREEN_700)
        self.cta_resultado = ft.Text("0.00", size=18, weight=ft.FontWeight.BOLD, color=ft.Colors.GREEN_700)
        self.n_resultado = ft.Text("0.00", size=14, weight=ft.FontWeight.BOLD, color=ft.Colors.BLUE_700)

        self.build_ui()

    def build_ui(self):
        """INTERFAZ CON SCROLL"""
        self.content = ft.Column(
            [
                # ENCABEZADO
                ft.Container(
                    content=ft.Row([
                        ft.Text("MODELO DE PRODUCCIÓN INTERNA", 
                               size=20, 
                               weight=ft.FontWeight.BOLD, 
                               color=ft.Colors.GREEN_700),
                        ft.IconButton(
                            icon=ft.Icons.ARROW_BACK, 
                            icon_color=ft.Colors.GREEN_700,
                            on_click=self.volver_menu
                        )
                    ]),
                    padding=15,
                    bgcolor=ft.Colors.GREEN_50
                ),
                
                # PANEL DE PARÁMETROS
                ft.Card(
                    content=ft.Container(
                        content=ft.Column([
                            ft.Text("Parámetros del Sistema", 
                                   size=16, 
                                   weight=ft.FontWeight.BOLD),
                            
                            ft.ResponsiveRow([
                                ft.Column([self.s_field], col=6),
                                ft.Column([self.d_field], col=6),
                            ]),
                            
                            ft.ResponsiveRow([
                                ft.Column([self.h_field], col=6),
                                ft.Column([self.a_field], col=6),
                            ]),
                            
                            # INFORMACIÓN ADICIONAL
                            ft.Container(
                                content=ft.Column([
                                    ft.Text("Condición del modelo:", size=12, weight=ft.FontWeight.BOLD),
                                    ft.Text("La tasa de producción (a) debe ser mayor que la demanda (D)", 
                                           size=10, 
                                           color=ft.Colors.GREY_600),
                                ]),
                                padding=10,
                                bgcolor=ft.Colors.BLUE_50,
                                border_radius=8
                            ),
                            
                            # BOTÓN DE CÁLCULO
                            ft.Container(
                                content=ft.ElevatedButton(
                                    "CALCULAR PRODUCCIÓN",
                                    on_click=self.calcular,
                                    style=ft.ButtonStyle(
                                        bgcolor=ft.Colors.GREEN_400,
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
                                        ft.Text("Lote Producción (Q):", 
                                               size=14,
                                               weight=ft.FontWeight.W_500),
                                        self.q_resultado
                                    ]),
                                    ft.Row([
                                        ft.Text("Inventario Máximo (Sm):", 
                                               size=14,
                                               weight=ft.FontWeight.W_500),
                                        self.sm_resultado
                                    ]),
                                    ft.Row([
                                        ft.Text("Costo Total Anual (CTA):", 
                                               size=14,
                                               weight=ft.FontWeight.W_500),
                                        self.cta_resultado
                                    ]),
                                    ft.Row([
                                        ft.Text("Corridas por Año (N):", 
                                               size=14,
                                               weight=ft.FontWeight.W_500),
                                        self.n_resultado
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
            S = formulario.validar_entrada(self.s_field.value, "Costo preparación", 0.01)
            D = formulario.validar_entrada(self.d_field.value, "Demanda", 1)
            H = formulario.validar_entrada(self.h_field.value, "Costo mantenimiento", 0.01)
            a = formulario.validar_entrada(self.a_field.value, "Tasa producción", 1)

            # VALIDAR CONDICIÓN a > D
            if a <= D:
                raise ValueError("La tasa producción (a) debe ser mayor que la demanda (D)")

            # REALIZAR CÁLCULOS
            Q = formulario.Q(D, S, H, a, 3)  # Modelo 3 = Producción
            Sm = formulario.Sm(Q, D, S, H, a, 2)  # Ahora pasamos todos los parámetros en orden correcto
            N = D / Q  # Número de corridas
            CTA = formulario.calcular_CTA(D, Q, S, H, 3, a=a)

            # ACTUALIZAR RESULTADOS
            self.q_resultado.value = f"{Q:.2f}"
            self.sm_resultado.value = f"{Sm:.2f}"
            self.cta_resultado.value = f"${CTA:.2f}"
            self.n_resultado.value = f"{N:.2f}"
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