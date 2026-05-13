# shopping-cart Specification

## Purpose
Gestión del carrito de compras del lado del cliente, con persistencia en localStorage y soporte para personalización de productos mediante exclusión de ingredientes.

## Requirements

### Requirement: Gestión de items en el carrito
El sistema SHALL permitir agregar, eliminar y actualizar la cantidad de productos en el carrito de compras.

#### Scenario: Agregar un producto nuevo
- **WHEN** el usuario selecciona un producto y hace clic en "Agregar al carrito"
- **THEN** el sistema SHALL agregar el producto al store con cantidad 1

#### Scenario: Incrementar cantidad de un producto existente
- **WHEN** el usuario agrega un producto que ya se encuentra en el carrito (con la misma personalización)
- **THEN** el sistema SHALL incrementar la cantidad del item existente en lugar de duplicarlo

#### Scenario: Eliminar un item
- **WHEN** el usuario hace clic en el botón de eliminar de un item en el carrito
- **THEN** el sistema SHALL remover completamente el item del store

### Requirement: Personalización de productos (Exclusión de ingredientes)
El sistema SHALL permitir al usuario excluir ingredientes específicos de un producto antes de agregarlo al carrito.

#### Scenario: Agregar producto con ingredientes excluidos
- **WHEN** el usuario desmarca ingredientes opcionales y agrega el producto
- **THEN** el sistema SHALL guardar el item con la lista de IDs de ingredientes excluidos

#### Scenario: Diferenciación por personalización
- **WHEN** el usuario agrega el mismo producto dos veces pero con diferentes ingredientes excluidos
- **THEN** el sistema SHALL tratar cada uno como un item separado en el carrito

### Requirement: Cálculo automático de totales
El sistema SHALL calcular automáticamente el subtotal de cada item (precio * cantidad) y el total general del carrito.

#### Scenario: Actualización de totales al cambiar cantidad
- **WHEN** el usuario modifica la cantidad de un item en el carrito
- **THEN** el sistema SHALL recalcular el subtotal del item y el total general de forma inmediata

## ADDED Requirements
(No added requirements — spec created fresh from change shopping-cart-persistence)
