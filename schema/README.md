Tin Can Schema
==========================

A near-complete JSON schema for the 0.95 Tin Can/Experience API standard.
Most JSON Schema processors will not handle everything (such as format uri),
but most things should work so long as the processor supports $ref.

One vagary: in order to get SubStatement working without repeating all
the statement rules, statements will allow the objectType property. This is
not actually legal, but it means SubStatements are fully validated. I'm still
pondering ways to deal with that.
