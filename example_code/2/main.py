import flet as ft
from menu_principal import Menu_principal

def main(page: ft.Page):
    """
    FUNCIÓN PRINCIPAL DE LA APLICACIÓN
    """
    # CONFIGURACIÓN DE LA PÁGINA
    page.title = "Sistema de Modelos de Inventario"
    page.window.width = 1200
    page.window.height = 800
    page.window.min_width = 800
    page.window.min_height = 600
    page.window.center()
    
    # MOSTRAR MENÚ PRINCIPAL
    menu = Menu_principal(page)
    page.add(menu)
    page.update()

if __name__ == "__main__":
    ft.app(target=main)