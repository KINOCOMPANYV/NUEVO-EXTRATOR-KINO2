import re
import os
import pandas as pd
import pdfplumber
from flask import Flask, request, render_template
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(fn):
    return '.' in fn and fn.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.template_filter('parse_table')
def parse_table_filter(html_string):
    """Parse HTML table into list of dicts for template rendering"""
    if not html_string:
        return []
    # This filter is not used anymore - we'll pass data directly
    return []


@app.route('/', methods=['GET','POST'])
def index():
    encontrados = []
    posibles = []
    error_msg = None
    total_encontrados = 0
    total_posibles = 0


    if request.method == 'POST':
        f = request.files.get('pdf')
        if not f or not allowed_file(f.filename):
            error_msg = "Sube un PDF válido."
        else:
            fn = secure_filename(f.filename)
            path = os.path.join(app.config['UPLOAD_FOLDER'], fn)
            f.save(path)

            try:
                encontrados = []  # Alta confianza
                posibles = []     # Baja confianza
                
                # Patrones de alta confianza
                # Nota: El guion '-' dentro de [] debe ir al final para no ser interpretado como rango
                combined_pat = re.compile(r'^(\d+)[x×]\s*([A-Za-z0-9][A-Za-z0-9:.-]*)$', re.IGNORECASE)
                qty_only_pat = re.compile(r'^(\d+)[x×]\s*$')
                
                # Patrones de baja confianza
                code_only_pat = re.compile(r'^[A-Za-z0-9][A-Za-z0-9:.-]{2,}$')  # Código sin cantidad
                qty_space_code_pat = re.compile(r'^(\d+)\s+([A-Za-z0-9][A-Za-z0-9:.-]+)$')  # Cantidad espacio código
                long_number_pat = re.compile(r'^\d{5,}$')  # Números largos pueden ser códigos

                with pdfplumber.open(path) as pdf:

                    for page in pdf.pages:
                        words = page.extract_words(use_text_flow=True)
                        i = 0
                        while i < len(words):
                            txt = words[i]['text']
                            added = False
                            
                            # ALTA CONFIANZA: Cantidad+X+Código en misma palabra
                            m1 = combined_pat.match(txt)
                            if m1:
                                cantidad = int(m1.group(1))
                                codigo = m1.group(2)
                                encontrados.append({'codigo': codigo, 'cantidad': cantidad})
                                i += 1
                                continue
                            
                            # ALTA CONFIANZA: Cantidad+X seguido de código
                            m2 = qty_only_pat.match(txt)
                            if m2 and i + 1 < len(words):
                                siguiente = words[i+1]['text']
                                if re.match(r'^[A-Za-z0-9][A-Za-z0-9:.-]*$', siguiente):
                                    cantidad = int(m2.group(1))
                                    encontrados.append({'codigo': siguiente, 'cantidad': cantidad})
                                    i += 2
                                    continue
                                else:
                                    # Hay cantidad sin código válido
                                    posibles.append({'codigo': '?', 'cantidad': int(m2.group(1)), 'razon': f'Cantidad sin código claro (siguiente: {siguiente})'})
                                    i += 1
                                    continue
                            
                            # BAJA CONFIANZA: Cantidad + espacio + código (sin 'x')
                            m3 = qty_space_code_pat.match(txt)
                            if m3:
                                cantidad = int(m3.group(1))
                                codigo = m3.group(2)
                                posibles.append({'codigo': codigo, 'cantidad': cantidad, 'razon': 'Patrón sin "x" (cantidad espacio código)'})
                                i += 1
                                continue
                            
                            # BAJA CONFIANZA: Código sin cantidad
                            m4 = code_only_pat.match(txt)
                            if m4:
                                # Verificar que no sea una palabra común (tiene que tener números o guiones)
                                if re.search(r'[0-9\-:]', txt):

                                    posibles.append({'codigo': txt, 'cantidad': '?', 'razon': 'Código sin cantidad'})
                                    added = True
                            
                            # BAJA CONFIANZA: Números largos (pueden ser códigos)
                            m5 = long_number_pat.match(txt)
                            if m5 and not added:
                                posibles.append({'codigo': txt, 'cantidad': '?', 'razon': 'Número largo (posible código)'})
                            
                            i += 1

                total_encontrados = len(encontrados)
                total_posibles = len(posibles)
                
                if total_encontrados == 0 and total_posibles == 0:
                    error_msg = "No se hallaron códigos/cantidades en el PDF."

            except Exception as e:
                error_msg = f"Error al procesar el PDF: {e}"

    return render_template(
        'index.html',
        encontrados=encontrados,
        posibles=posibles,
        error=error_msg,
        total_encontrados=total_encontrados,
        total_posibles=total_posibles
    )


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
