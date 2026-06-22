from graphviz import Digraph
from pathlib import Path

out = Path('data_flow_diagram_level0.png')
dot = Digraph('G', filename='data_flow_diagram_level0', format='png')
dot.attr(rankdir='LR', bgcolor='white', splines='ortho')
dot.attr('node', shape='box', style='filled', fillcolor='white', color='black', fontcolor='black', penwidth='1.2')
dot.attr('edge', color='black', arrowsize='0.8', penwidth='1.0')

dot.node('u', 'Customer / Delivery Person')
dot.node('p', 'Sahachari Delivery System')
dot.node('a', 'Admin / Manager')
dot.node('d1', 'User Database')
dot.node('d2', 'Order Database')
dot.node('d3', 'Payment Database')

dot.edge('u', 'p', 'Login, Order Request, Status Update, Payment Info')
dot.edge('a', 'p', 'Manage Users, Orders, Payments')
dot.edge('p', 'd1', 'User Details')
dot.edge('p', 'd2', 'Order Records')
dot.edge('p', 'd3', 'Payment Records')
dot.edge('p', 'u', 'Order Confirmation / Status Update')
dot.edge('p', 'a', 'Reports / User Updates')

dot.render(cleanup=True)
print(out.name)
