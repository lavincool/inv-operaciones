import flet as ft
from menu_principal import MenuPrincipalColas

def main(page: ft.Page):
    try:
        # Configuracion de la ventana principal
        page.title = "Sistema de Analisis de Colas - Modelos de Espera Probabilisticos"
        page.window.width = 1200
        page.window.height = 800
        page.window.min_width = 1000
        page.window.min_height = 600
        page.window.center()
        page.theme_mode = ft.ThemeMode.LIGHT
        page.padding = 10
        page.scroll = ft.ScrollMode.ADAPTIVE
        
        # Mostrar menu principal de navegacion
        menu = MenuPrincipalColas(page)
        page.add(menu)
        page.update()
    except Exception as e:
        print(f"Error al iniciar la aplicación: {e}")
        page.add(ft.Text(f"Error: {str(e)}", color=ft.Colors.RED))
        page.update()

if __name__ == "__main__":
    ft.app(target=main)