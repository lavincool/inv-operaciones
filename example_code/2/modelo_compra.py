import flet as ft
import formulario 

class Modelo_compra(ft.Container):
    """
    MODELO DE COMPRA ECONÓMICA (EOQ)
    Interfaz simplificada y funcional
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
            label="Costo por Pedido (S)", 
            width=200
        )
        self.dias_field = ft.TextField(
            label="Días Laborales", 
            width=200
        )
        self.costo_mantenimiento_field = ft.TextField(
            label="Costo Mantenimiento (H)", 
            width=200
        )
        
        # OPCIÓN CALCULAR H
        self.calcular_h_checkbox = ft.Checkbox(
            label="Calcular H automáticamente", 
            value=False,
            on_change=self.toggle_calculo_h,
            label_style=ft.TextStyle(color=ft.Colors.WHITE)
        )
        self.costo_unitario_field = ft.TextField(
            label="Costo Unitario (C)", 
            width=200, 
            visible=False,
            color=ft.Colors.WHITE,  
            label_style=ft.TextStyle(color=ft.Colors.WHITE)  
        )
        self.tasa_mantenimiento_field = ft.TextField(
            label="Tasa Mantenimiento (%)", 
            width=200, 
            visible=False,
            color=ft.Colors.WHITE, 
            label_style=ft.TextStyle(color=ft.Colors.WHITE)
        )

        # RESULTADOS
        self.q_resultado = ft.Text("0.00", size=18, weight=ft.FontWeight.BOLD, color=ft.Colors.BLUE_700)
        self.cta_resultado = ft.Text("0.00", size=18, weight=ft.FontWeight.BOLD, color=ft.Colors.BLUE_700)
        self.ctu_resultado = ft.Text("0.00", size=18, weight=ft.FontWeight.BOLD, color=ft.Colors.BLUE_700)

        self.build_ui()

    def toggle_calculo_h(self, e):
        """Activa/desactiva cálculo de H"""
        self.costo_mantenimiento_field.visible = not self.calcular_h_checkbox.value
        self.costo_unitario_field.visible = self.calcular_h_checkbox.value
        self.tasa_mantenimiento_field.visible = self.calcular_h_checkbox.value
        self.update()

    def build_ui(self):
        """CONSTRUYE INTERFAZ CON SCROLL"""
        self.content = ft.Column(
            [
                # ENCABEZADO
                ft.Container(
                    content=ft.Row([
                        ft.Text("MODELO DE COMPRA ECONÓMICA", 
                               size=20, 
                               weight=ft.FontWeight.BOLD, 
                               color=ft.Colors.BLUE_700),
                        ft.IconButton(
                            icon=ft.Icons.ARROW_BACK, 
                            icon_color=ft.Colors.BLUE_700,
                            on_click=self.volver_menu
                        )
                    ]),
                    padding=15,
                    bgcolor=ft.Colors.BLUE_50
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
                                ft.Column([self.dias_field], col=6),
                                ft.Column([self.costo_mantenimiento_field], col=6),
                            ]),
                            
                            # OPCIÓN CALCULAR H
                            ft.Container(
                                content=ft.Column([
                                    self.calcular_h_checkbox,
                                    ft.ResponsiveRow([
                                        ft.Column([self.costo_unitario_field], col=6),
                                        ft.Column([self.tasa_mantenimiento_field], col=6),
                                    ]),
                                ]),
                                padding=10,
                                bgcolor=ft.Colors.BLUE_100,
                                border_radius=8
                            ),
                            
                            # BOTÓN DE CÁLCULO
                            ft.Container(
                                content=ft.ElevatedButton(
                                    "CALCULAR MODELO",
                                    on_click=self.calcular,
                                    style=ft.ButtonStyle(
                                        bgcolor=ft.Colors.BLUE_400,
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
                                        ft.Text("Cantidad óptima (Q):", 
                                               size=14,
                                               weight=ft.FontWeight.W_500),
                                        self.q_resultado
                                    ]),
                                    ft.Row([
                                        ft.Text("Costo Total Anual (CTA):", 
                                               size=14,
                                               weight=ft.FontWeight.W_500),
                                        self.cta_resultado
                                    ]),
                                    ft.Row([
                                        ft.Text("Costo Total Unitario (CTU):", 
                                               size=14,
                                               weight=ft.FontWeight.W_500),
                                        self.ctu_resultado
                                    ]),
                                ], spacing=15),
                                padding=20
                            )
                        ]),
                        padding=20
                    ),
                    margin=10
                ),
                
                # ESPACIO FINAL PARA SCROLL
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
            dias = formulario.validar_entrada(self.dias_field.value, "Días laborales", 1, 365)
            
            # CALCULAR O OBTENER H
            if self.calcular_h_checkbox.value:
                C = formulario.validar_entrada(self.costo_unitario_field.value, "Costo unitario", 0.01)
                I = formulario.validar_entrada(self.tasa_mantenimiento_field.value, "Tasa mantenimiento", 0, 100)
                H = formulario.calcular_costo_mantenimiento(C, I)
            else:
                H = formulario.validar_entrada(self.costo_mantenimiento_field.value, "Costo mantenimiento", 0.01)

            # REALIZAR CÁLCULOS
            Q = formulario.Q(D, S, H, 0, 1)  # Modelo 1 = EOQ básico
            d = formulario.ConvD(D, dias, 1)  # Convertir a diario
            CTA = formulario.calcular_CTA(D, Q, S, H, 1)  # Modelo 1
            CTU = CTA / D  # Costo total unitario

            # ACTUALIZAR RESULTADOS
            self.q_resultado.value = f"{Q:.2f}"
            self.cta_resultado.value = f"${CTA:.2f}"
            self.ctu_resultado.value = f"${CTU:.2f}"
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
        """REGRESA AL MENÚ"""
        from menu_principal import Menu_principal
        self.page.clean()
        menu = Menu_principal(self.page)
        self.page.add(menu)
        self.page.update()