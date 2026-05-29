import flet as ft
from calculos_colas import CalculosColas

class ColaCapacidadLimitada(ft.Container):
    """
    INTERFAZ PARA MODELO M/M/1/N - COLA CON CAPACIDAD LIMITADA
    """
    
    def __init__(self, page):
        super().__init__()
        self.page = page
        self.calculador = CalculosColas()
        
        # VARIABLES ESPECIFICAS PARA M/M/1/N
        self.lambda_val = ft.TextField(label="Tasa de llegada (λ)", width=200)
        self.mu_val = ft.TextField(label="Tasa de servicio (μ)", width=200)
        self.capacidad_val = ft.TextField(label="Capacidad maxima (N)", width=200)
        self.cs_val = ft.TextField(label="Costo servicio ($/hora)", width=200)
        self.ce_val = ft.TextField(label="Costo espera ($/hora)", width=200)
        
        # OPCIONES DE UNIDADES
        self.lambda_unit = ft.RadioGroup(value="minuto", content=ft.Row([
            ft.Radio(value="minuto", label="Minutos"),
            ft.Radio(value="hora", label="Horas")
        ]))
        
        self.mu_unit = ft.RadioGroup(value="minuto", content=ft.Row([
            ft.Radio(value="minuto", label="Minutos"),
            ft.Radio(value="hora", label="Horas")
        ]))
        
        # TIPO DE ENTRADA
        self.lambda_type = ft.RadioGroup(value="cliente_tiempo", content=ft.Row([
            ft.Radio(value="cliente_tiempo", label="Clientes por unidad de tiempo"),
            ft.Radio(value="tiempo_cliente", label="Unidad de tiempo por cliente")
        ]))
        
        self.mu_type = ft.RadioGroup(value="cliente_tiempo", content=ft.Row([
            ft.Radio(value="cliente_tiempo", label="Clientes por unidad de tiempo"),
            ft.Radio(value="tiempo_cliente", label="Unidad de tiempo por cliente")
        ]))
        
        # RESULTADOS
        self.p_label = ft.Text("0.0000", size=16, weight=ft.FontWeight.BOLD, color=ft.Colors.GREEN)
        self.p0_label = ft.Text("0.0000", size=16, weight=ft.FontWeight.BOLD, color=ft.Colors.GREEN)
        self.lq_label = ft.Text("0.0000", size=16, weight=ft.FontWeight.BOLD, color=ft.Colors.GREEN)
        self.wq_label = ft.Text("0.0000", size=16, weight=ft.FontWeight.BOLD, color=ft.Colors.GREEN)
        self.l_label = ft.Text("0.0000", size=16, weight=ft.FontWeight.BOLD, color=ft.Colors.GREEN)
        self.w_label = ft.Text("0.0000", size=16, weight=ft.FontWeight.BOLD, color=ft.Colors.GREEN)
        self.capacidad_label = ft.Text("0.0%", size=16, weight=ft.FontWeight.BOLD, color=ft.Colors.GREEN)
        self.ct_label = ft.Text("$ 0.00", size=20, weight=ft.FontWeight.BOLD, color=ft.Colors.RED)
        
        self.build_ui()
    
    def build_ui(self):
        """CONSTRUCCION DE LA INTERFAZ CON SCROLL"""
        self.content = ft.Column(
            [
                ft.Container(
                    content=ft.Column([
                        ft.Row([
                            ft.Text("MODELO M/M/1/N - COLA CON CAPACIDAD LIMITADA", 
                                   size=20, weight=ft.FontWeight.BOLD, color=ft.Colors.GREEN),
                            ft.IconButton(icon=ft.Icons.ARROW_BACK, on_click=self.volver_menu)
                        ]),
                        ft.Text("Sistema con un servidor y capacidad maxima de N clientes en el sistema",
                               size=12, color=ft.Colors.GREY),
                        ft.Divider()
                    ]),
                    padding=10,
                    bgcolor=ft.Colors.WHITE
                ),
                
                ft.Column(
                    [
                        ft.Card(
                            content=ft.Container(
                                content=ft.Column([
                                    ft.Text("Parametros del Sistema M/M/1/N", size=16, weight=ft.FontWeight.BOLD),
                                    
                                    ft.ResponsiveRow([
                                        ft.Column([
                                            self.lambda_val,
                                            ft.Text("Unidades λ:", size=12, weight=ft.FontWeight.BOLD),
                                            self.lambda_unit
                                        ], col=6),
                                        ft.Column([
                                            self.mu_val,
                                            ft.Text("Unidades μ:", size=12, weight=ft.FontWeight.BOLD),
                                            self.mu_unit
                                        ], col=6)
                                    ]),
                                    
                                    ft.Container(
                                        content=ft.Column([
                                            ft.Text("Tipo de entrada λ:", size=12, weight=ft.FontWeight.BOLD),
                                            self.lambda_type
                                        ]),
                                        padding=10
                                    ),
                                    
                                    ft.Container(
                                        content=ft.Column([
                                            ft.Text("Tipo de entrada μ:", size=12, weight=ft.FontWeight.BOLD),
                                            self.mu_type
                                        ]),
                                        padding=10
                                    ),
                                    
                                    ft.ResponsiveRow([
                                        ft.Column([self.capacidad_val], col=4),
                                        ft.Column([self.cs_val], col=4),
                                        ft.Column([self.ce_val], col=4)
                                    ]),
                                    
                                    ft.Container(
                                        content=ft.ElevatedButton(
                                            "CALCULAR MODELO M/M/1/N",
                                            on_click=self.calcular_modelo,
                                            style=ft.ButtonStyle(
                                                bgcolor=ft.Colors.GREEN,
                                                color=ft.Colors.WHITE,
                                                padding=20
                                            )
                                        ),
                                        padding=20,
                                        alignment=ft.alignment.center
                                    )
                                ]),
                                padding=20
                            ),
                            margin=10
                        ),
                        
                        ft.Card(
                            content=ft.Container(
                                content=ft.Column([
                                    ft.Text("Resultados del Modelo M/M/1/N", size=16, weight=ft.FontWeight.BOLD),
                                    
                                    ft.ResponsiveRow([
                                        ft.Column([
                                            ft.Container(
                                                content=ft.Column([
                                                    ft.Row([ft.Text("Utilizacion del sistema (ρ):"), self.p_label]),
                                                    ft.Row([ft.Text("Probabilidad sistema vacio (P0):"), self.p0_label]),
                                                    ft.Row([ft.Text("Clientes en cola (Lq):"), self.lq_label]),
                                                    ft.Row([ft.Text("Tiempo en cola (Wq):"), self.wq_label])
                                                ]),
                                                padding=10
                                            )
                                        ], col=6),
                                        ft.Column([
                                            ft.Container(
                                                content=ft.Column([
                                                    ft.Row([ft.Text("Clientes en sistema (L):"), self.l_label]),
                                                    ft.Row([ft.Text("Tiempo en sistema (W):"), self.w_label]),
                                                    ft.Row([ft.Text("Capacidad utilizada:"), self.capacidad_label])
                                                ]),
                                                padding=10
                                            )
                                        ], col=6)
                                    ]),
                                    
                                    ft.Divider(),
                                    
                                    ft.Container(
                                        content=ft.Row([
                                            ft.Text("COSTO TOTAL DEL SISTEMA:", 
                                                   size=16, weight=ft.FontWeight.BOLD, color=ft.Colors.RED),
                                            self.ct_label
                                        ], alignment=ft.MainAxisAlignment.CENTER),
                                        padding=20
                                    )
                                ]),
                                padding=20
                            ),
                            margin=10
                        ),
                        
                        ft.Container(height=50)
                    ],
                    scroll=ft.ScrollMode.ADAPTIVE,
                    expand=True
                )
            ],
            expand=True
        )
    
    def calcular_modelo(self, e):
        try:
            # OBTENER Y VALIDAR PARAMETROS
            lambda_val = self.lambda_val.value.strip()
            mu_val = self.mu_val.value.strip()
            capacidad_val = self.capacidad_val.value.strip()
            cs_val = self.cs_val.value.strip()
            ce_val = self.ce_val.value.strip()
            
            if not lambda_val or not mu_val or not capacidad_val or not cs_val or not ce_val:
                self.mostrar_error("Todos los campos deben ser completados")
                return
            
            lambda_val = float(lambda_val)
            mu_val = float(mu_val)
            capacidad = float(capacidad_val)
            cs = float(cs_val)
            ce = float(ce_val)
            
            if lambda_val <= 0 or mu_val <= 0 or capacidad <= 0:
                self.mostrar_error("λ, μ y N deben ser mayores a cero")
                return
            
            # CONVERSION DE UNIDADES
            lambda_conv, mu_conv = self.calculador.convertir_unidades(
                lambda_val, mu_val,
                self.lambda_unit.value, self.mu_unit.value,
                self.lambda_type.value, self.mu_type.value
            )
            
            # CALCULAR MODELO M/M/1/N (sin parámetro n)
            resultados = self.calculador.calcular_mm1n(lambda_conv, mu_conv, capacidad, cs, ce)
            
            # ACTUALIZAR INTERFAZ
            self.actualizar_resultados(resultados, capacidad)
            
        except ValueError as ve:
            self.mostrar_error(f"Error de valor: {str(ve)}")
        except Exception as ex:
            self.mostrar_error(f"Error en el calculo: {str(ex)}")
    
    def actualizar_resultados(self, resultados, capacidad):
        self.p_label.value = f"{resultados['P']:.4f}"
        self.p0_label.value = f"{resultados['P0']:.6f}"
        self.l_label.value = f"{resultados['L']:.4f}"
        self.lq_label.value = f"{resultados['Lq']:.4f}"
        self.w_label.value = f"{resultados['W']:.4f}"
        self.wq_label.value = f"{resultados['Wq']:.4f}"
        self.ct_label.value = f"$ {resultados['CT']:.2f}"
        
        # CALCULAR CAPACIDAD UTILIZADA
        if capacidad > 0:
            utilizacion = (resultados['L'] / capacidad) * 100
            self.capacidad_label.value = f"{utilizacion:.1f}%"
        else:
            self.capacidad_label.value = "0.0%"
        self.update()
    
    def mostrar_error(self, mensaje):
        self.page.show_snack_bar(ft.SnackBar(
            content=ft.Text(mensaje),
            duration=3000
        ))
    
    def volver_menu(self, e):
        from menu_principal import MenuPrincipalColas
        self.page.clean()
        menu = MenuPrincipalColas(self.page)
        self.page.add(menu)
        self.page.update()