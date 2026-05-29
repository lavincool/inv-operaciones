import flet as ft
from calculos_colas import CalculosColas

class ColaMultiplesServidores(ft.Container):
    """
    INTERFAZ PARA MODELO M/M/S - COLA CON MULTIPLES SERVIDORES
    """
    
    def __init__(self, page):
        super().__init__()
        self.page = page
        self.calculador = CalculosColas()
        
        # VARIABLES ESPECIFICAS PARA M/M/S
        self.lambda_val = ft.TextField(label="Tasa de llegada (λ)", width=200)
        self.mu_val = ft.TextField(label="Tasa de servicio (μ)", width=200)
        self.servidores_val = ft.TextField(label="Numero de servidores (S)", width=200)
        self.n_val = ft.TextField(label="Clientes para P(n)", width=200)
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
        self.p_label = ft.Text("0.0000", size=16, weight=ft.FontWeight.BOLD, color=ft.Colors.PURPLE)
        self.pn_label = ft.Text("0.0000", size=16, weight=ft.FontWeight.BOLD, color=ft.Colors.PURPLE)
        self.p0_label = ft.Text("0.0000", size=16, weight=ft.FontWeight.BOLD, color=ft.Colors.PURPLE)
        self.lq_label = ft.Text("0.0000", size=16, weight=ft.FontWeight.BOLD, color=ft.Colors.PURPLE)
        self.l_label = ft.Text("0.0000", size=16, weight=ft.FontWeight.BOLD, color=ft.Colors.PURPLE)
        self.w_label = ft.Text("0.0000", size=16, weight=ft.FontWeight.BOLD, color=ft.Colors.PURPLE)
        self.wq_label = ft.Text("0.0000", size=16, weight=ft.FontWeight.BOLD, color=ft.Colors.PURPLE)
        self.servidores_label = ft.Text("0 de 0", size=16, weight=ft.FontWeight.BOLD, color=ft.Colors.PURPLE)
        self.ct_label = ft.Text("$ 0.00", size=20, weight=ft.FontWeight.BOLD, color=ft.Colors.RED)
        
        self.build_ui()
    
    def build_ui(self):
        """CONSTRUCCION DE LA INTERFAZ CON SCROLL"""
        self.content = ft.Column(
            [
                ft.Container(
                    content=ft.Column([
                        ft.Row([
                            ft.Text("MODELO M/M/S - COLA CON MULTIPLES SERVIDORES", 
                                   size=20, weight=ft.FontWeight.BOLD, color=ft.Colors.PURPLE),
                            ft.IconButton(icon=ft.Icons.ARROW_BACK, on_click=self.volver_menu)
                        ]),
                        ft.Text("Sistema con multiples servidores, llegadas Poisson y tiempos de servicio exponenciales",
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
                                    ft.Text("Parametros del Sistema M/M/S", size=16, weight=ft.FontWeight.BOLD),
                                    
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
                                        ft.Column([self.servidores_val], col=3),
                                        ft.Column([self.n_val], col=3),
                                        ft.Column([self.cs_val], col=3),
                                        ft.Column([self.ce_val], col=3)
                                    ]),
                                    
                                    ft.Container(
                                        content=ft.ElevatedButton(
                                            "CALCULAR MODELO M/M/S",
                                            on_click=self.calcular_modelo,
                                            style=ft.ButtonStyle(
                                                bgcolor=ft.Colors.PURPLE,
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
                                    ft.Text("Resultados del Modelo M/M/S", size=16, weight=ft.FontWeight.BOLD),
                                    
                                    ft.ResponsiveRow([
                                        ft.Column([
                                            ft.Container(
                                                content=ft.Column([
                                                    ft.Row([ft.Text("Utilizacion del sistema (ρ):"), self.p_label]),
                                                    ft.Row([ft.Text("Probabilidad de n clientes (Pn):"), self.pn_label]),
                                                    ft.Row([ft.Text("Probabilidad sistema vacio (P0):"), self.p0_label]),
                                                    ft.Row([ft.Text("Clientes en cola (Lq):"), self.lq_label])
                                                ]),
                                                padding=10
                                            )
                                        ], col=6),
                                        ft.Column([
                                            ft.Container(
                                                content=ft.Column([
                                                    ft.Row([ft.Text("Clientes en sistema (L):"), self.l_label]),
                                                    ft.Row([ft.Text("Tiempo en sistema (W):"), self.w_label]),
                                                    ft.Row([ft.Text("Tiempo en cola (Wq):"), self.wq_label]),
                                                    ft.Row([ft.Text("Servidores activos:"), self.servidores_label])
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
            lambda_val = float(self.lambda_val.value) if self.lambda_val.value else 0
            mu_val = float(self.mu_val.value) if self.mu_val.value else 0
            servidores = float(self.servidores_val.value) if self.servidores_val.value else 0
            
            if lambda_val <= 0 or mu_val <= 0 or servidores <= 0:
                self.mostrar_error("Todos los valores deben ser mayores a cero")
                return
            
            if servidores < 1:
                self.mostrar_error("Debe haber al menos 1 servidor")
                return
            
            # CONVERSION DE UNIDADES
            lambda_conv, mu_conv = self.calculador.convertir_unidades(
                lambda_val, mu_val,
                self.lambda_unit.value, self.mu_unit.value,
                self.lambda_type.value, self.mu_type.value
            )
            
            # VALIDAR ESTABILIDAD DEL SISTEMA
            if not self.calculador.validar_estabilidad_mms(lambda_conv, mu_conv, servidores):
                self.mostrar_error(f"El sistema no es estable: λ ({lambda_conv:.4f}) debe ser menor que S*μ ({servidores * mu_conv:.4f})")
                return
            
            # CALCULAR MODELO M/M/S
            n = float(self.n_val.value) if self.n_val.value else 0
            cs = float(self.cs_val.value) if self.cs_val.value else 0
            ce = float(self.ce_val.value) if self.ce_val.value else 0
            
            resultados = self.calculador.calcular_mms(lambda_conv, mu_conv, servidores, n, cs, ce)
            
            # ACTUALIZAR INTERFAZ
            self.actualizar_resultados(resultados, servidores)
            
        except ValueError:
            self.mostrar_error("Por favor ingresa valores numericos validos")
        except Exception as ex:
            self.mostrar_error(f"Error en el calculo: {str(ex)}")
    
    def actualizar_resultados(self, resultados, servidores):
        self.p_label.value = f"{resultados['P']:.4f}"
        self.pn_label.value = f"{resultados['Pn']:.6f}"
        self.p0_label.value = f"{resultados['P0']:.6f}"
        self.l_label.value = f"{resultados['L']:.4f}"
        self.lq_label.value = f"{resultados['Lq']:.4f}"
        self.w_label.value = f"{resultados['W']:.4f}"
        self.wq_label.value = f"{resultados['Wq']:.4f}"
        self.ct_label.value = f"$ {resultados['CT']:.2f}"
        
        # CALCULAR SERVIDORES ACTIVOS PROMEDIO
        servidores_activos = resultados['L'] - resultados['Lq']
        self.servidores_label.value = f"{servidores_activos:.1f} de {servidores:.0f}"
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