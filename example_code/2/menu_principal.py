import flet as ft
from modelo_compra import Modelo_compra
from modelo_escases import Modelo_escases
from modelo_probabilistico import Modelo_probabilistico
from modelo_produccion import Modelo_produccion
from modelo_descuento import Modelo_descuento

class Menu_principal(ft.Container):
    """
    MENÚ PRINCIPAL DEL SISTEMA DE MODELOS DE INVENTARIO
    Diseño moderno con tarjetas para cada modelo
    """
    
    def __init__(self, page):
        super().__init__()
        self.page = page
        self.bgcolor = ft.Colors.BLUE_GREY_50
        self.expand = True
        self.build_ui()

    def build_ui(self):
        """CONSTRUYE LA INTERFAZ PRINCIPAL"""
        self.content = ft.Column(
            [
                # ENCABEZADO DEL SISTEMA
                ft.Container(
                    content=ft.Column([
                        ft.Text("SISTEMA DE MODELOS DE INVENTARIO", 
                               size=24, 
                               weight=ft.FontWeight.BOLD,
                               color=ft.Colors.BLUE_900),
                        ft.Text("Unidad 4: Gestión de Inventarios - Investigación de Operaciones",
                               size=14,
                               color=ft.Colors.GREY_700),
                    ], horizontal_alignment=ft.CrossAxisAlignment.CENTER),
                    padding=20,
                    alignment=ft.alignment.center,
                    bgcolor=ft.Colors.WHITE
                ),
                
                ft.Container(height=20),
                
                # TARJETAS DE MODELOS ORGANIZADAS EN FILA RESPONSIVA
                ft.ResponsiveRow(
                    [
                        # MODELO COMPRA 
                        ft.Container(
                            content=ft.Card(
                                content=ft.Container(
                                    content=ft.Column([
                                        ft.Icon(ft.Icons.SHOPPING_CART, 
                                               size=40, 
                                               color=ft.Colors.BLUE_400),
                                        ft.Text("Modelo Compra", 
                                               size=18, 
                                               weight=ft.FontWeight.BOLD),
                                        ft.Text("Compra económica de lotes", 
                                               size=12),
                                        ft.Container(height=10),
                                        ft.ElevatedButton(
                                            "Abrir Modelo",
                                            on_click=lambda _: self.abrir_modelo(Modelo_compra),
                                            style=ft.ButtonStyle(
                                                bgcolor=ft.Colors.BLUE_100,
                                                color=ft.Colors.BLUE_800
                                            )
                                        )
                                    ], horizontal_alignment=ft.CrossAxisAlignment.CENTER),
                                    padding=20
                                ),
                                elevation=5
                            ),
                            col={"sm": 12, "md": 6, "lg": 4},
                            padding=10
                        ),
                        
                        # MODELO PRODUCCION
                        ft.Container(
                            content=ft.Card(
                                content=ft.Container(
                                    content=ft.Column([
                                        ft.Icon(ft.Icons.FACTORY, 
                                               size=40, 
                                               color=ft.Colors.GREEN_400),
                                        ft.Text("Modelo Produccion", 
                                               size=18, 
                                               weight=ft.FontWeight.BOLD),
                                        ft.Text("Producción interna", 
                                               size=12),
                                        ft.Container(height=10),
                                        ft.ElevatedButton(
                                            "Abrir Modelo",
                                            on_click=lambda _: self.abrir_modelo(Modelo_produccion),
                                            style=ft.ButtonStyle(
                                                bgcolor=ft.Colors.GREEN_100,
                                                color=ft.Colors.GREEN_800
                                            )
                                        )
                                    ], horizontal_alignment=ft.CrossAxisAlignment.CENTER),
                                    padding=20
                                ),
                                elevation=5
                            ),
                            col={"sm": 12, "md": 6, "lg": 4},
                            padding=10
                        ),
                        
                        # MODELO DESCUENTO 
                        ft.Container(
                            content=ft.Card(
                                content=ft.Container(
                                    content=ft.Column([
                                        ft.Icon(ft.Icons.DISCOUNT, 
                                               size=40, 
                                               color=ft.Colors.ORANGE_400),
                                        ft.Text("Modelo Con Descuento", 
                                               size=18, 
                                               weight=ft.FontWeight.BOLD),
                                        ft.Text("Múltiples niveles descuento", 
                                               size=12),
                                        ft.Container(height=10),
                                        ft.ElevatedButton(
                                            "Abrir Modelo",
                                            on_click=lambda _: self.abrir_modelo(Modelo_descuento),
                                            style=ft.ButtonStyle(
                                                bgcolor=ft.Colors.ORANGE_100,
                                                color=ft.Colors.ORANGE_800
                                            )
                                        )
                                    ], horizontal_alignment=ft.CrossAxisAlignment.CENTER),
                                    padding=20
                                ),
                                elevation=5
                            ),
                            col={"sm": 12, "md": 6, "lg": 4},
                            padding=10
                        ),
                        
                        # MODELO ESCASES
                        ft.Container(
                            content=ft.Card(
                                content=ft.Container(
                                    content=ft.Column([
                                        ft.Icon(ft.Icons.WARNING, 
                                               size=40, 
                                               color=ft.Colors.RED_400),
                                        ft.Text("Modelo Con Escases", 
                                               size=18, 
                                               weight=ft.FontWeight.BOLD),
                                        ft.Text("Faltantes permitidos", 
                                               size=12),
                                        ft.Container(height=10),
                                        ft.ElevatedButton(
                                            "Abrir Modelo",
                                            on_click=lambda _: self.abrir_modelo(Modelo_escases),
                                            style=ft.ButtonStyle(
                                                bgcolor=ft.Colors.RED_100,
                                                color=ft.Colors.RED_800
                                            )
                                        )
                                    ], horizontal_alignment=ft.CrossAxisAlignment.CENTER),
                                    padding=20
                                ),
                                elevation=5
                            ),
                            col={"sm": 12, "md": 6, "lg": 4},
                            padding=10
                        ),
                        
                        # MODELO PROBABILISTICO 
                        ft.Container(
                            content=ft.Card(
                                content=ft.Container(
                                    content=ft.Column([
                                        ft.Icon(ft.Icons.PIE_CHART, 
                                               size=40, 
                                               color=ft.Colors.PURPLE_400),
                                        ft.Text("Modelo Probabilistico", 
                                               size=18, 
                                               weight=ft.FontWeight.BOLD),
                                        ft.Text("Stock seguridad", 
                                               size=12),
                                        ft.Container(height=10),
                                        ft.ElevatedButton(
                                            "Abrir Modelo",
                                            on_click=lambda _: self.abrir_modelo(Modelo_probabilistico),
                                            style=ft.ButtonStyle(
                                                bgcolor=ft.Colors.PURPLE_100,
                                                color=ft.Colors.PURPLE_800
                                            )
                                        )
                                    ], horizontal_alignment=ft.CrossAxisAlignment.CENTER),
                                    padding=20
                                ),
                                elevation=5
                            ),
                            col={"sm": 12, "md": 6, "lg": 4},
                            padding=10
                        ),
                    ],
                    alignment=ft.MainAxisAlignment.CENTER
                ),
                
                ft.Container(height=30),
                
                # INFORMACION DEL SISTEMA
                ft.Container(
                    content=ft.Text("Sistema desarrollado para Investigación de Operaciones - Gestión de Inventarios",
                                   size=12,
                                   color=ft.Colors.GREY_500),
                    alignment=ft.alignment.center,
                    padding=10
                )
            ],
            scroll=ft.ScrollMode.ADAPTIVE,  # SCROLL HABILITADO
            expand=True,
            horizontal_alignment=ft.CrossAxisAlignment.CENTER
        )
    
    def abrir_modelo(self, modelo_class):
        """
        MÉTODO PARA CAMBIAR ENTRE MODELOS
        """
        self.page.clean()
        modelo = modelo_class(self.page)
        self.page.add(modelo)
        self.page.update()