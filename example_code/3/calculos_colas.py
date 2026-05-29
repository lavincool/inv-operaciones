import math

class CalculosColas:
    """
    CLASE PRINCIPAL PARA CALCULOS DE MODELOS DE COLAS
    Contiene todas las formulas matematicas para los cuatro modelos:
    - M/M/1: Cola simple con un servidor
    - M/C/1: Cola con servicio constante (determinístico)
    - M/M/1/N: Cola con capacidad limitada  
    - M/M/S: Cola con multiples servidores
    """
    
    @staticmethod
    def factorial(n):
        """Calcula el factorial de un numero - necesario para formulas probabilisticas"""
        if n == 0 or n == 1:
            return 1
        # Para numeros decimales, convertimos a entero
        if isinstance(n, float) and n.is_integer():
            n = int(n)
        try:
            return math.factorial(int(n))
        except (ValueError, OverflowError):
            return 1
    
    def convertir_unidades(self, lambda_val, mu_val, lambda_unit, mu_unit, lambda_type, mu_type):
        """
        CONVERSION DE UNIDADES DE TIEMPO
        Permite trabajar con diferentes unidades (minutos/horas) y tipos (clientes/tiempo o tiempo/cliente)
        """
        # Validar valores
        if lambda_val is None or mu_val is None:
            return lambda_val, mu_val
            
        try:
            # Conversion entre minutos y horas
            if lambda_unit == "minuto" and mu_unit == "hora":
                lambda_val = lambda_val * 60  # Convertir λ de minutos a horas
            elif lambda_unit == "hora" and mu_unit == "minuto":
                mu_val = mu_val * 60  # Convertir μ de minutos a horas
            
            # Conversion de tipo (cliente/tiempo vs tiempo/cliente)
            if lambda_type == "tiempo_cliente" and lambda_val != 0:
                lambda_val = 1 / lambda_val  # Invertir para obtener clientes/tiempo
            if mu_type == "tiempo_cliente" and mu_val != 0:
                mu_val = 1 / mu_val  # Invertir para obtener clientes/tiempo
                
        except (ZeroDivisionError, TypeError, ValueError):
            pass
            
        return lambda_val, mu_val
    
    def validar_estabilidad_mm1(self, lambda_val, mu_val):
        """VALIDACION DE ESTABILIDAD PARA M/M/1: λ debe ser menor que μ"""
        try:
            return lambda_val < mu_val
        except (TypeError, ValueError):
            return False
    
    def validar_estabilidad_mms(self, lambda_val, mu_val, servidores):
        """VALIDACION DE ESTABILIDAD PARA M/M/S: λ debe ser menor que S*μ"""
        try:
            return lambda_val < servidores * mu_val
        except (TypeError, ValueError):
            return False
    
    # MODELO M/M/1 - FORMULAS
    def calcular_mm1(self, lambda_val, mu_val, n, cs, ce):
        """
        MODELO M/M/1 - COLA SIMPLE CON UN SERVIDOR
        Caracteristicas: Llegadas Poisson, servicio exponencial, un servidor, capacidad infinita
        """
        try:
            # Validaciones
            if lambda_val <= 0 or mu_val <= 0:
                raise ValueError("λ y μ deben ser mayores a cero")
            
            # Calculo de utilizacion promedio del sistema
            P = lambda_val / mu_val
            
            # Validar estabilidad
            if P >= 1:
                raise ValueError("El sistema no es estable: ρ >= 1")
            
            # Probabilidad de que exactamente N clientes esten en el sistema
            Pn = (1 - P) * (P ** n)
            
            # Probabilidad de que el sistema este vacio (cero clientes)
            P0 = 1 - P
            
            # Numero promedio de clientes en el sistema (incluyendo servicio)
            L = lambda_val / (mu_val - lambda_val)
            
            # Numero promedio de clientes en la fila de espera (excluyendo servicio)
            Lq = P * L
            
            # Tiempo promedio que un cliente pasa en el sistema (incluyendo servicio)
            W = 1 / (mu_val - lambda_val)
            
            # Tiempo promedio que un cliente espera en la fila (excluyendo servicio)
            Wq = P * W
            
            # Costo total del sistema = costo servicio + costo de espera
            CT = cs + (ce * Lq)
            
            return {
                'P': P, 'Pn': Pn, 'P0': P0,
                'L': L, 'Lq': Lq,
                'W': W, 'Wq': Wq,
                'CT': CT
            }
        except Exception as e:
            raise ValueError(f"Error en cálculo M/M/1: {str(e)}")
    
    # MODELO M/C/1 - FORMULAS (Servicio Constante)
    def calcular_mc1(self, lambda_val, mu_val, cs, ce):
        """
        MODELO M/C/1 - COLA CON SERVICIO CONSTANTE
        Caracteristicas: Llegadas Poisson, servicio constante (determinístico), un servidor
        Formulas para servicio constante (no exponencial)
        """
        try:
            # Validaciones
            if lambda_val <= 0 or mu_val <= 0:
                raise ValueError("λ y μ deben ser mayores a cero")
            
            # Calculo de utilizacion promedio del sistema
            P = lambda_val / mu_val
            
            # Validar estabilidad
            if P >= 1:
                raise ValueError("El sistema no es estable: ρ >= 1")
            
            # Probabilidad de que el sistema este vacio (cero clientes)
            P0 = 1 - P
            
            # Numero promedio de clientes en la fila de espera (formula para servicio constante)
            # Formula: Lq = λ² / (2μ(μ - λ))
            Lq = (lambda_val ** 2) / (2 * mu_val * (mu_val - lambda_val))
            
            # Numero promedio de clientes en el sistema
            L = Lq + (lambda_val / mu_val)
            
            # Tiempo promedio de espera en la fila
            Wq = Lq / lambda_val
            
            # Tiempo promedio en el sistema
            W = Wq + (1 / mu_val)
            
            # Costo total del sistema
            CT = cs + (ce * Lq)
            
            # Para M/C/1, no tenemos formula simple para Pn
            Pn = 0  # No se calcula directamente en este modelo
            
            return {
                'P': P, 'Pn': Pn, 'P0': P0,
                'L': L, 'Lq': Lq,
                'W': W, 'Wq': Wq,
                'CT': CT
            }
        except Exception as e:
            raise ValueError(f"Error en cálculo M/C/1: {str(e)}")
    
    # MODELO M/M/1/N - FORMULAS
    def calcular_mm1n(self, lambda_val, mu_val, capacidad, cs, ce):
        """
        MODELO M/M/1/N - COLA CON CAPACIDAD LIMITADA
        Caracteristicas: Llegadas Poisson, servicio exponencial, un servidor, capacidad maxima N
        Cuando el sistema esta lleno, los clientes nuevos son rechazados
        """
        try:
            # Validaciones
            if lambda_val <= 0 or mu_val <= 0 or capacidad <= 0:
                raise ValueError("λ, μ y N deben ser mayores a cero")
            
            if capacidad < 1:
                raise ValueError("La capacidad N debe ser al menos 1")
            
            # Calculo de probabilidad de que el sistema este vacio
            P0 = 0
            for i in range(int(capacidad) + 1):
                try:
                    termino = self.factorial(capacidad) / self.factorial(capacidad - i) * (lambda_val / mu_val) ** i
                    P0 += termino
                except:
                    continue
            
            if P0 == 0:
                raise ValueError("Error en cálculo de P0")
            
            P0 = 1 / P0
            
            # Utilizacion promedio del sistema
            Rho = 1 - P0
            
            # Numero promedio de clientes en la fila de espera
            # Formula corregida: Lq = N - ((λ + μ) / λ) * (1 - P0)
            Lq = capacidad - ((lambda_val + mu_val) / lambda_val) * (1 - P0)
            
            # Numero promedio de clientes en el sistema
            # Formula: L = N - (μ / λ) * (1 - P0)
            L = capacidad - (mu_val / lambda_val) * (1 - P0)
            
            # Tiempo promedio en el sistema
            # W = L / ((N - L) * λ)
            if (capacidad - L) * lambda_val != 0:
                W = L / ((capacidad - L) * lambda_val)
            else:
                W = 0
            
            # Tiempo promedio de espera en la fila
            # Wq = Lq / ((N - L) * λ)
            if (capacidad - L) * lambda_val != 0:
                Wq = Lq / ((capacidad - L) * lambda_val)
            else:
                Wq = 0
            
            # Costo total del sistema
            CT = cs + (ce * L)
            
            return {
                'P': Rho, 'Pn': 0, 'P0': P0,
                'L': L, 'Lq': Lq,
                'W': W, 'Wq': Wq,
                'CT': CT
            }
        except Exception as e:
            raise ValueError(f"Error en cálculo M/M/1/N: {str(e)}")
    
    # MODELO M/M/S - FORMULAS
    def calcular_mms(self, lambda_val, mu_val, servidores, n, cs, ce):
        """
        MODELO M/M/S - COLA CON MULTIPLES SERVIDORES
        Caracteristicas: Llegadas Poisson, servicio exponencial, S servidores, capacidad infinita
        Los clientes forman una sola fila y son atendidos por el primer servidor disponible
        """
        try:
            # Validaciones
            if lambda_val <= 0 or mu_val <= 0 or servidores <= 0:
                raise ValueError("λ, μ y S deben ser mayores a cero")
            
            if servidores < 1:
                raise ValueError("Debe haber al menos 1 servidor")
            
            # Utilizacion promedio del sistema
            Rho = lambda_val / (servidores * mu_val)
            
            # Validar estabilidad
            if Rho >= 1:
                raise ValueError("El sistema no es estable: ρ >= 1")
            
            # Probabilidad de que el sistema este vacio (formula compleja que suma todas las probabilidades)
            P0 = 0
            for i in range(int(servidores)):
                try:
                    termino = (lambda_val / mu_val) ** i / self.factorial(i)
                    P0 += termino
                except:
                    continue
            
            # Completar el calculo de P0
            try:
                term_final = ((lambda_val / mu_val) ** servidores / self.factorial(servidores)) * (1 / (1 - Rho))
                P0 += term_final
                if P0 != 0:
                    P0 = 1 / P0
                else:
                    P0 = 0
            except:
                P0 = 0
            
            # Probabilidad de que haya exactamente N clientes en el sistema
            Pn = 0
            if P0 != 0:
                if 0 < n < servidores:
                    try:
                        Pn = ((lambda_val / mu_val) ** n / self.factorial(n)) * P0
                    except:
                        Pn = 0
                elif n >= servidores:
                    try:
                        Pn = ((lambda_val / mu_val) ** n / (self.factorial(servidores) * (servidores ** (n - servidores)))) * P0
                    except:
                        Pn = 0
            
            # Numero promedio de clientes en la fila de espera
            try:
                Lq = (P0 * (lambda_val / mu_val) ** servidores * Rho) / (self.factorial(servidores) * (1 - Rho) ** 2)
            except:
                Lq = 0
            
            # Tiempo promedio de espera en la fila
            if lambda_val != 0:
                Wq = Lq / lambda_val
            else:
                Wq = 0
            
            # Tiempo promedio en el sistema (incluyendo servicio)
            W = Wq + (1 / mu_val)
            
            # Numero promedio de clientes en el sistema
            L = lambda_val * W
            
            # Costo total del sistema
            CT = cs + (ce * L)
            
            return {
                'P': Rho, 'Pn': Pn, 'P0': P0,
                'L': L, 'Lq': Lq,
                'W': W, 'Wq': Wq,
                'CT': CT
            }
        except Exception as e:
            raise ValueError(f"Error en cálculo M/M/S: {str(e)}")