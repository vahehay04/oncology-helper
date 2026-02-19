/**
 * Маппинг нозологий RUSSCO 2025 → специфичные дополнительные поля
 * Источник: https://rosoncoweb.ru/standarts/RUSSCO/2025/
 *
 * Каждая запись:
 *   keywords: ключевые слова для распознавания из текста диагноза (регистронезависимо)
 *   label: читаемое название нозологии
 *   fields: массив доп. полей
 *
 * Типы полей: select, multiselect, text, number
 */

export const ONCOLOGY_FIELD_MAP = [
  {
    id: "nsclc",
    label: "Немелкоклеточный рак лёгкого (НМРЛ)",
    keywords: ["немелкоклеточный рак лёгкого", "немелкоклеточный рак легкого", "нмрл", "nsclc", "аденокарцинома лёгкого", "аденокарцинома легкого", "плоскоклеточный рак лёгкого", "плоскоклеточный рак легкого", "крупноклеточный рак лёгкого"],
    fields: [
      { key: "lung_localization", label: "Локализация опухоли", type: "select", options: ["Верхняя доля правого лёгкого", "Средняя доля правого лёгкого", "Нижняя доля правого лёгкого", "Верхняя доля левого лёгкого", "Нижняя доля левого лёгкого", "Главный бронх", "Билобарное поражение", "Двустороннее поражение"] },
      { key: "lung_histology_detail", label: "Гистологический подтип", type: "select", options: ["Аденокарцинома", "Плоскоклеточный рак", "Крупноклеточная карцинома", "Аденосквамозная карцинома", "Саркоматоидная карцинома", "NUT-карцинома"] },
      { key: "egfr_mutation", label: "Мутация EGFR", type: "select", options: ["Не определялась", "Отрицательная (WT)", "Экзон 19 del", "Экзон 21 L858R", "Экзон 20 ins", "Экзон 20 T790M", "Редкие мутации"] },
      { key: "alk_fusion", label: "ALK транслокация", type: "select", options: ["Не определялась", "Отрицательная", "Положительная"] },
      { key: "ros1_fusion", label: "ROS1 транслокация", type: "select", options: ["Не определялась", "Отрицательная", "Положительная"] },
      { key: "kras_g12c", label: "KRAS G12C мутация", type: "select", options: ["Не определялась", "Отрицательная", "Положительная"] },
      { key: "pdl1_expression", label: "PD-L1 экспрессия (TPS, %)", type: "select", options: ["Не определялась", "< 1%", "1–49%", "≥ 50%"] },
      { key: "met_exon14", label: "MET экзон 14 скипинг", type: "select", options: ["Не определялась", "Отрицательная", "Положительная"] },
      { key: "braf_v600e", label: "BRAF V600E мутация", type: "select", options: ["Не определялась", "Отрицательная", "Положительная"] },
      { key: "ret_fusion", label: "RET транслокация", type: "select", options: ["Не определялась", "Отрицательная", "Положительная"] },
      { key: "ntrk_fusion", label: "NTRK транслокация", type: "select", options: ["Не определялась", "Отрицательная", "Положительная"] },
      { key: "brain_metastases", label: "Метастазы в ГМ", type: "select", options: ["Нет", "Есть (стабильные)", "Есть (активные)", "Лептоменингеальные"] },
    ],
  },
  {
    id: "sclc",
    label: "Мелкоклеточный рак лёгкого (МРЛ)",
    keywords: ["мелкоклеточный рак лёгкого", "мелкоклеточный рак легкого", "мрл", "sclc"],
    fields: [
      { key: "sclc_stage_va", label: "Стадия по VA/IASLC", type: "select", options: ["Limited disease (LD) — I–III стадия", "Extensive disease (ED) — IV стадия"] },
      { key: "sclc_brain_metastases", label: "Метастазы в ГМ", type: "select", options: ["Нет", "Есть (симптомные)", "Есть (бессимптомные)", "Лептоменингеальные"] },
      { key: "sclc_pci", label: "Профилактическое краниальное облучение (ПКО)", type: "select", options: ["Не проводилось", "Проводилось", "Планируется"] },
    ],
  },
  {
    id: "breast",
    label: "Рак молочной железы",
    keywords: ["рак молочной железы", "рмж", "breast cancer", "карцинома молочной железы"],
    fields: [
      { key: "her2_status", label: "HER2 статус", type: "select", options: ["Не определялся", "HER2-отрицательный (0)", "HER2-отрицательный (1+)", "HER2 2+ (FISH отрицательный)", "HER2 2+ (FISH положительный)", "HER2-положительный (3+)", "HER2-ультранизкий (1+)", "HER2-низкий (2+ FISH-отриц.)"] },
      { key: "er_status", label: "ER статус", type: "select", options: ["Не определялся", "ER-отрицательный (< 1%)", "ER-положительный 1–9%", "ER-положительный ≥ 10%"] },
      { key: "pr_status", label: "PR статус", type: "select", options: ["Не определялся", "PR-отрицательный (< 1%)", "PR-положительный 1–9%", "PR-положительный ≥ 10%"] },
      { key: "ki67", label: "Ki-67 (%)", type: "select", options: ["Не определялся", "< 14%", "14–20%", "> 20%"] },
      { key: "brca_status", label: "BRCA1/2 статус", type: "select", options: ["Не определялся", "BRCA1/2 wild-type", "BRCA1 мутация", "BRCA2 мутация", "gBRCA мутация", "sBRCA мутация"] },
      { key: "molecular_subtype", label: "Молекулярный подтип", type: "select", options: ["Luminal A", "Luminal B (HER2-отриц.)", "Luminal B (HER2-полож.)", "HER2-обогащённый", "Triple-negative (ТНРМЖ)"] },
      { key: "pikhd3_mutation", label: "PIK3CA мутация", type: "select", options: ["Не определялась", "Отрицательная", "Положительная"] },
    ],
  },
  {
    id: "colorectal",
    label: "Рак ободочной и прямой кишки (КРР)",
    keywords: ["рак ободочной кишки", "рак прямой кишки", "колоректальный рак", "крр", "рак толстой кишки", "рак толстого кишечника", "рак сигмовидной кишки", "рак ректосигмоидного"],
    fields: [
      { key: "ras_status", label: "RAS статус (KRAS/NRAS)", type: "select", options: ["Не определялся", "RAS wild-type", "KRAS экзон 2 (кодоны 12/13)", "KRAS экзон 3 (кодоны 59/61)", "KRAS экзон 4 (кодоны 117/146)", "NRAS мутация"] },
      { key: "braf_crc", label: "BRAF V600E", type: "select", options: ["Не определялся", "BRAF wild-type", "BRAF V600E мутация"] },
      { key: "msi_status", label: "MSI/MMR статус", type: "select", options: ["Не определялся", "MSS / MMR-proficient (pMMR)", "MSI-H / MMR-дефицитный (dMMR)"] },
      { key: "her2_crc", label: "HER2 амплификация", type: "select", options: ["Не определялась", "Отрицательная", "Положительная"] },
      { key: "sidedness", label: "Сторонность опухоли", type: "select", options: ["Правосторонняя (слепая — поперечная кишка)", "Левосторонняя (нисходящая — прямая кишка)", "Прямая кишка", "Синхронные опухоли"] },
      { key: "resectability", label: "Резектабельность", type: "select", options: ["Резектабельная", "Потенциально резектабельная", "Нерезектабельная"] },
    ],
  },
  {
    id: "ovarian",
    label: "Рак яичников / первичный рак брюшины / рак маточных труб",
    keywords: ["рак яичников", "рак яичника", "рак брюшины", "рак маточных труб", "рак маточной трубы"],
    fields: [
      { key: "brca_ovarian", label: "BRCA1/2 статус", type: "select", options: ["Не определялся", "BRCA wild-type", "gBRCA1 мутация", "gBRCA2 мутация", "sBRCA мутация"] },
      { key: "hrd_status", label: "HRD статус", type: "select", options: ["Не определялся", "HRD-отрицательный", "HRD-положительный"] },
      { key: "figo_stage", label: "Стадия по FIGO", type: "select", options: ["I", "IA", "IB", "IC", "IC1", "IC2", "IC3", "II", "IIA", "IIB", "III", "IIIA", "IIIA1", "IIIA2", "IIIB", "IIIC", "IV", "IVA", "IVB"] },
      { key: "residual_tumor", label: "Остаточная опухоль после операции", type: "select", options: ["R0 (нет остатков)", "R1 (< 1 см)", "R2 (> 1 см)", "Операция не выполнялась"] },
      { key: "parp_inhibitor_received", label: "PARP-ингибиторы в анамнезе", type: "select", options: ["Нет", "Олапариб", "Нирапариб", "Рукапариб"] },
    ],
  },
  {
    id: "cervical",
    label: "Рак шейки матки",
    keywords: ["рак шейки матки", "рак шейки", "цервикальный рак", "плоскоклеточный рак шейки"],
    fields: [
      { key: "figo_stage_cervical", label: "Стадия по FIGO (2018)", type: "select", options: ["IA1", "IA2", "IB1", "IB2", "IB3", "IIA1", "IIA2", "IIB", "IIIA", "IIIB", "IIIC1", "IIIC2", "IVA", "IVB"] },
      { key: "pdl1_cervical", label: "PD-L1 (CPS)", type: "select", options: ["Не определялся", "CPS < 1", "CPS 1–9", "CPS ≥ 1", "CPS ≥ 10"] },
      { key: "hpv_status", label: "ВПЧ-статус", type: "select", options: ["Не определялся", "ВПЧ-ассоциированный (16/18)", "ВПЧ-ассоциированный (другой тип)", "ВПЧ-независимый"] },
    ],
  },
  {
    id: "endometrial",
    label: "Рак тела матки",
    keywords: ["рак тела матки", "рак эндометрия", "эндометриальный рак", "карцинома эндометрия"],
    fields: [
      { key: "figo_stage_uterus", label: "Стадия по FIGO (2023)", type: "select", options: ["IA", "IA1", "IA2", "IB", "IC", "II", "IIA", "IIB", "IIIA", "IIIB", "IIIC1", "IIIC2", "IVA", "IVB"] },
      { key: "msi_uterus", label: "MSI/MMR статус", type: "select", options: ["Не определялся", "MSS / pMMR", "MSI-H / dMMR"] },
      { key: "pole_mutation", label: "POLE мутация (ultramutated)", type: "select", options: ["Не определялась", "Отрицательная", "Положительная (POLE-экзонуклеазный домен)"] },
      { key: "p53_status", label: "p53 статус", type: "select", options: ["Не определялся", "p53 дикий тип (WT)", "p53 аберрантный"] },
      { key: "her2_uterus", label: "HER2 (серозный рак)", type: "select", options: ["Не применимо", "Не определялся", "Отрицательный", "Положительный (3+)", "2+ (FISH полож.)"] },
    ],
  },
  {
    id: "gastric",
    label: "Рак желудка / пищеводно-желудочного перехода",
    keywords: ["рак желудка", "рак пищевода", "аденокарцинома желудка", "рак пищеводно-желудочного", "рак кардии"],
    fields: [
      { key: "her2_gastric", label: "HER2 статус", type: "select", options: ["Не определялся", "HER2-отрицательный (0/1+)", "HER2 2+ (ISH отриц.)", "HER2-положительный (3+ или 2+ ISH полож.)"] },
      { key: "pdl1_gastric", label: "PD-L1 (CPS)", type: "select", options: ["Не определялся", "CPS < 1", "CPS 1–4", "CPS ≥ 1", "CPS ≥ 5"] },
      { key: "msi_gastric", label: "MSI/MMR статус", type: "select", options: ["Не определялся", "MSS / pMMR", "MSI-H / dMMR"] },
      { key: "fgfr2_amplification", label: "FGFR2 амплификация", type: "select", options: ["Не определялась", "Отрицательная", "Положительная"] },
      { key: "lauren_type", label: "Тип по Lauren", type: "select", options: ["Не указан", "Кишечный", "Диффузный", "Смешанный"] },
    ],
  },
  {
    id: "melanoma",
    label: "Меланома кожи",
    keywords: ["меланома", "melanoma"],
    fields: [
      { key: "braf_melanoma", label: "BRAF V600 мутация", type: "select", options: ["Не определялась", "BRAF wild-type", "BRAF V600E", "BRAF V600K", "Другая BRAF V600"] },
      { key: "nras_melanoma", label: "NRAS мутация", type: "select", options: ["Не определялась", "Отрицательная", "Положительная"] },
      { key: "kit_melanoma", label: "c-KIT мутация/амплификация", type: "select", options: ["Не определялась", "Отрицательная", "Положительная"] },
      { key: "ulceration", label: "Изъязвление опухоли", type: "select", options: ["Не оценивалось", "Нет", "Есть"] },
      { key: "clark_level", label: "Уровень инвазии по Кларку", type: "select", options: ["Не оценивался", "I", "II", "III", "IV", "V"] },
      { key: "breslow_thickness", label: "Толщина по Бреслоу (мм)", type: "select", options: ["Не измерялась", "≤ 1,0 мм", "1,01–2,0 мм", "2,01–4,0 мм", "> 4,0 мм"] },
      { key: "sentinel_node", label: "Биопсия сторожевого ЛУ", type: "select", options: ["Не выполнялась", "Отрицательная", "Положительная", "Не применимо (IV стадия)"] },
    ],
  },
  {
    id: "renal",
    label: "Почечноклеточный рак (ПКР)",
    keywords: ["почечноклеточный рак", "рак почки", "рак паренхимы почки", "светлоклеточный рак почки", "pkr", "почечно-клеточный"],
    fields: [
      { key: "rcc_histology", label: "Гистологический подтип", type: "select", options: ["Светлоклеточный (ccRCC)", "Папиллярный тип 1", "Папиллярный тип 2", "Хромофобный", "Карцинома собирательных трубочек", "Неклассифицируемый"] },
      { key: "imdc_score", label: "Прогностическая группа IMDC", type: "select", options: ["Не определялась", "Благоприятная (0 факторов)", "Промежуточная (1–2 фактора)", "Неблагоприятная (≥ 3 факторов)"] },
      { key: "nephrectomy", label: "Нефрэктомия", type: "select", options: ["Не выполнялась", "Радикальная", "Частичная", "Циторедуктивная"] },
      { key: "vhl_mutation", label: "VHL мутация/HIF-2α", type: "select", options: ["Не определялась", "Отрицательная", "VHL мутация (HIF-2α активирован)"] },
    ],
  },
  {
    id: "prostate",
    label: "Рак предстательной железы (РПЖ)",
    keywords: ["рак предстательной железы", "рак простаты", "рпж", "аденокарцинома простаты", "аденокарцинома предстательной железы"],
    fields: [
      { key: "psa_initial", label: "ПСА на момент постановки диагноза (нг/мл)", type: "text" },
      { key: "gleason_score", label: "Сумма Глисона / Grade Group", type: "select", options: ["GG1 (≤ 6 / 3+3)", "GG2 (7 / 3+4)", "GG3 (7 / 4+3)", "GG4 (8 / 4+4 или 3+5 или 5+3)", "GG5 (9–10)"] },
      { key: "brca_prostate", label: "BRCA1/2 / HRR мутация", type: "select", options: ["Не определялась", "Отрицательная (HRR-proficient)", "BRCA1 мутация", "BRCA2 мутация", "Другая HRR мутация (ATM, CDK12 и др.)"] },
      { key: "castration_status", label: "Кастрационный статус", type: "select", options: ["Гормон-чувствительный (ГЧРПЖ)", "Кастрационно-резистентный (КРРПЖ)", "Неметастатический КРРПЖ"] },
      { key: "ar_splice_variant", label: "AR-V7 (вариант сплайсинга)", type: "select", options: ["Не определялся", "AR-V7 отрицательный", "AR-V7 положительный"] },
    ],
  },
  {
    id: "bladder",
    label: "Рак мочевого пузыря",
    keywords: ["рак мочевого пузыря", "уротелиальная карцинома", "переходноклеточный рак мочевого пузыря"],
    fields: [
      { key: "bladder_type", label: "Тип по инвазии", type: "select", options: ["Неинвазивный (NMIBC: Ta, T1, CIS)", "Мышечно-инвазивный (MIBC: T2–T4)", "Метастатический"] },
      { key: "fgfr3_bladder", label: "FGFR3 мутация/транслокация", type: "select", options: ["Не определялась", "Отрицательная", "Положительная"] },
      { key: "pdl1_bladder", label: "PD-L1 (IC)", type: "select", options: ["Не определялся", "IC < 5%", "IC ≥ 5%"] },
      { key: "cisplatin_eligible", label: "Пригодность к цисплатину", type: "select", options: ["Пригоден к цисплатину", "Непригоден к цисплатину (КФ < 60, ECOG ≥ 2 и др.)"] },
    ],
  },
  {
    id: "pancreatic",
    label: "Рак поджелудочной железы",
    keywords: ["рак поджелудочной железы", "аденокарцинома поджелудочной железы", "протоковая аденокарцинома"],
    fields: [
      { key: "resectability_pancreas", label: "Резектабельность", type: "select", options: ["Резектабельный", "Пограничный резектабельный (Borderline resectable)", "Местно-распространённый нерезектабельный", "Метастатический"] },
      { key: "brca_pancreas", label: "BRCA1/2 / PALB2 мутация", type: "select", options: ["Не определялась", "Отрицательная", "BRCA1 мутация", "BRCA2 мутация", "PALB2 мутация"] },
      { key: "msi_pancreas", label: "MSI статус", type: "select", options: ["Не определялся", "MSS", "MSI-H / dMMR"] },
      { key: "ntrk_pancreas", label: "NTRK транслокация", type: "select", options: ["Не определялась", "Отрицательная", "Положительная"] },
    ],
  },
  {
    id: "hcc",
    label: "Гепатоцеллюлярный рак (ГЦК)",
    keywords: ["гепатоцеллюлярный рак", "рак печени", "гцк", "гепатоцеллюлярная карцинома"],
    fields: [
      { key: "child_pugh", label: "Класс Child-Pugh", type: "select", options: ["A5", "A6", "B7", "B8", "B9", "C10–15"] },
      { key: "bclc_stage", label: "Стадия BCLC", type: "select", options: ["0 (Very early)", "A (Early)", "B (Intermediate)", "C (Advanced)", "D (Terminal)"] },
      { key: "portal_vein_invasion", label: "Инвазия в воротную вену", type: "select", options: ["Нет", "Сегментарная", "Долевая (Vp3)", "Главный ствол (Vp4)"] },
      { key: "afp_level", label: "АФП (нг/мл)", type: "select", options: ["Не определялся", "< 400", "400–2000", "> 2000"] },
    ],
  },
  {
    id: "headneck",
    label: "Опухоли головы и шеи",
    keywords: ["рак глотки", "рак гортани", "рак ротоглотки", "рак носоглотки", "рак полости рта", "рак языка", "опухоль головы и шеи", "плоскоклеточный рак головы и шеи", "рак слюнных желез"],
    fields: [
      { key: "hn_site", label: "Локализация", type: "select", options: ["Полость рта", "Ротоглотка", "Гортаноглотка", "Гортань", "Носоглотка", "Слюнные железы", "Носовая полость / синусы", "Неизвестная первичная локализация"] },
      { key: "hpv_hn", label: "HPV-статус (ротоглотка)", type: "select", options: ["Не применимо", "Не определялся", "HPV-ассоциированный (p16+)", "HPV-негативный (p16-)"] },
      { key: "pdl1_hn", label: "PD-L1 (CPS)", type: "select", options: ["Не определялся", "CPS < 1", "CPS 1–19", "CPS ≥ 1", "CPS ≥ 20"] },
      { key: "ebv_hn", label: "EBV-статус (носоглотка)", type: "select", options: ["Не применимо", "EBV-ассоциированный", "EBV-негативный"] },
    ],
  },
  {
    id: "lymphoma_hodgkin",
    label: "Лимфома Ходжкина",
    keywords: ["лимфома ходжкина", "болезнь ходжкина", "hodgkin"],
    fields: [
      { key: "ann_arbor_stage", label: "Стадия по Ann Arbor", type: "select", options: ["I", "II", "III", "IV"] },
      { key: "ann_arbor_modifiers", label: "Модификаторы стадии", type: "select", options: ["A (без симптомов)", "B (с симптомами)", "E (экстранодальное поражение)", "S (поражение селезёнки)", "BE", "BS"] },
      { key: "bulk_disease", label: "Булк-опухоль (≥ 10 см)", type: "select", options: ["Нет", "Есть"] },
      { key: "ips_score", label: "МПС (IPS) прогностический индекс", type: "select", options: ["Не рассчитывался", "0 (очень благоприятный)", "1", "2", "3", "≥ 4 (неблагоприятный)"] },
    ],
  },
  {
    id: "dlbcl",
    label: "Диффузная В-крупноклеточная лимфома (ДВККЛ)",
    keywords: ["диффузная в-крупноклеточная лимфома", "двккл", "dlbcl", "крупноклеточная лимфома"],
    fields: [
      { key: "ann_arbor_dlbcl", label: "Стадия по Ann Arbor", type: "select", options: ["I", "II", "III", "IV"] },
      { key: "ipi_score", label: "МПИ (IPI) индекс", type: "select", options: ["Не рассчитывался", "0–1 (низкий риск)", "2 (промежуточно-низкий)", "3 (промежуточно-высокий)", "4–5 (высокий риск)"] },
      { key: "cell_of_origin", label: "Клеточное происхождение (COO)", type: "select", options: ["Не определялось", "GCB (germinal center B-cell)", "non-GCB / ABC", "Неклассифицируемое"] },
      { key: "myc_bcl2_rearrangement", label: "MYC/BCL2/BCL6 перестройка", type: "select", options: ["Не определялась", "Нет", "MYC+", "Double-hit (MYC+BCL2 или MYC+BCL6)", "Triple-hit"] },
    ],
  },
  {
    id: "myeloma",
    label: "Множественная миелома",
    keywords: ["множественная миелома", "миелома", "myeloma", "плазмоклеточная миелома"],
    fields: [
      { key: "iss_stage", label: "Стадия по R-ISS", type: "select", options: ["Не определялась", "I", "II", "III"] },
      { key: "cytogenetic_risk_myeloma", label: "Цитогенетический риск", type: "select", options: ["Не определялся", "Стандартный", "Высокий (del17p, t(4;14), t(14;16))", "Ультравысокий (≥ 2 высокорисковых аномалий)"] },
      { key: "transplant_eligible", label: "Пригодность к ВДХТ + АТСКК", type: "select", options: ["Пригоден", "Непригоден (возраст, коморбидность)"] },
    ],
  },
  {
    id: "crc_rectum",
    label: "Рак прямой кишки",
    keywords: ["рак прямой кишки", "рак прямой"],
    fields: [
      { key: "mrт_staging_rectum", label: "MRT-стадирование", type: "select", options: ["mrT1", "mrT2", "mrT3a/b", "mrT3c/d", "mrT4a", "mrT4b"] },
      { key: "emvi", label: "Экстрамуральная сосудистая инвазия (EMVI)", type: "select", options: ["Не определялась", "Отсутствует", "Присутствует"] },
      { key: "crm_status", label: "Статус CRM (циркулярного края)", type: "select", options: ["Не определялся", "CRM ≥ 1 мм (свободный)", "CRM < 1 мм (угроза или поражение)"] },
      { key: "neoadjuvant_rt", label: "Неоадъювантная терапия (ХЛТ/ЛТ)", type: "select", options: ["Не проводилась", "Короткий курс ЛТ (5×5 Гр)", "Длинный курс ХЛТ", "Тотальная неоадъювантная терапия (TNT)"] },
      { key: "surgical_approach_rectum", label: "Вид операции", type: "select", options: ["Не выполнялась", "ТМЭ (тотальная мезоректумэктомия)", "Местное иссечение (TEM/TAMIS)", "Операция Гартмана", "Брюшно-промежностная экстирпация"] },
    ],
  },
];

/**
 * Определяет нозологию по тексту диагноза
 * @param {string} diagnosisText
 * @returns {object|null} — найденная запись из ONCOLOGY_FIELD_MAP или null
 */
export function detectOncologyType(diagnosisText) {
  if (!diagnosisText || diagnosisText.trim().length < 3) return null;
  const lower = diagnosisText.toLowerCase();

  // Сначала ищем наиболее специфичные совпадения (с большим числом слов в keyword)
  const sorted = [...ONCOLOGY_FIELD_MAP].sort(
    (a, b) => Math.max(...b.keywords.map(k => k.length)) - Math.max(...a.keywords.map(k => k.length))
  );

  for (const entry of sorted) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return entry;
    }
  }
  return null;
}