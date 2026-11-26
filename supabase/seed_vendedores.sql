-- Vendedores da Carteira de Clientes (nov/2026) + você como administrador.
-- Depois preencha o e-mail de cada um pela tela Usuários do sistema.
insert into public.vendedores (area, nome, equipe, supervisor, tipo, papel) values
  ('1510101', 'Andreia', 'Equipe 01', 'Renato', 'Auto', 'vendedor'),
  ('1510102', 'Ailton', 'Equipe 01', 'Renato', 'Auto', 'vendedor'),
  ('1510103', 'Silvia Raphael', 'Equipe 01', 'Renato', 'Auto', 'vendedor'),
  ('1510104', 'Daniel', 'Equipe 01', 'Renato', 'Auto', 'vendedor'),
  ('1510105', 'Thaís', 'Equipe 01', 'Renato', 'Auto', 'vendedor'),
  ('1510106', 'Nayara', 'Equipe 01', 'Renato', 'Auto', 'vendedor'),
  ('1510201', 'Gabriel', 'Equipe 02', 'Daniele', 'Auto', 'vendedor'),
  ('1510203', 'André', 'Equipe 02', 'Daniele', 'Auto', 'vendedor'),
  ('1510204', 'Mayara', 'Equipe 02', 'Daniele', 'Auto', 'vendedor'),
  ('1510205', 'Andrea', 'Equipe 02', 'Daniele', 'Auto', 'vendedor'),
  ('1510206', 'Diego T.', 'Equipe 02', 'Daniele', 'Auto', 'vendedor'),
  ('1510207', 'Diego F.', 'Equipe 02', 'Daniele', 'Auto', 'vendedor'),
  ('1510301', 'Danilo', 'Equipe 03', 'Junior', 'Auto', 'vendedor'),
  ('1510302', 'Leonardo', 'Equipe 03', 'Junior', 'Auto', 'vendedor'),
  ('1510303', 'Silvia', 'Equipe 03', 'Junior', 'Auto', 'vendedor'),
  ('1510304', 'Bruno', 'Equipe 03', 'Junior', 'Auto', 'vendedor'),
  ('1510305', 'Alan', 'Equipe 03', 'Junior', 'Auto', 'vendedor'),
  ('1510306', 'Jefferson', 'Equipe 03', 'Junior', 'Auto', 'vendedor'),
  ('1510401', 'Vanessa', 'Equipe 04', null, 'Auto total', 'vendedor'),
  ('1510402', 'Carlos H.', 'Equipe 04', null, 'Auto total', 'vendedor'),
  ('1510403', 'Lilia', 'Equipe 04', null, 'Auto total', 'vendedor'),
  ('1510404', 'Carol', 'Equipe 04', null, 'Auto total', 'vendedor'),
  ('1510405', 'Sem vendedor 1510405', 'Equipe 04', null, 'Auto total', 'vendedor'),
  ('1510406', 'Sem vendedor 1510406', 'Equipe 04', null, 'Auto total', 'vendedor'),
  ('1510604', 'Alec', 'Equipe 06', 'Lucas', 'Moto', 'vendedor'),
  ('1510605', 'Leandro', 'Equipe 06', 'Lucas', 'Moto', 'vendedor'),
  ('1510606', 'Pedro', 'Equipe 06', 'Lucas', 'Moto', 'vendedor')
on conflict (area) do update set nome=excluded.nome, equipe=excluded.equipe, supervisor=excluded.supervisor, tipo=excluded.tipo;

insert into public.vendedores (area, nome, email, papel) values ('ADMIN', 'Vinicius Sato', 'vinicius.sato@bateriasmoura.com', 'admin')
on conflict (area) do update set email=excluded.email, papel='admin';
