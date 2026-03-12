import { useState } from "react";
import { FileDown, Send, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


const PRODUCTION_ITEMS = [
    { description: "Cana Moída", unit: "TON" },
    { description: "RPM", unit: "UN" },
    { description: "Processo Dorna", unit: "UN" },
    { description: "Centrífugas", unit: "UN" },
    { description: "Produção Neutro", unit: "LT" },
    { description: "Produção Hidratado", unit: "LT" },
    { description: "Produção CO2", unit: "KG" },
    { description: "Produção Energia", unit: "MW/H" },
    { description: "Energia Exportada", unit: "MW/H" },
    { description: "Gerando", unit: "MW/H" },
    { description: "Extração", unit: "TON/VP" },
    { description: "Pressão da Caldeira", unit: "KGF/CM²" },
    { description: "Vazão da Caldeira", unit: "TON" },
    { description: "Nível do Canal", unit: "MT" },
    { description: "Pá-Carregadeira", unit: "UN" },
];

export default function HomePage() {
    const [supervisor, setSupervisor] = useState("");
    const [email, setEmail] = useState("");
    const [data, setData] = useState("");
    const [periodo, setPeriodo] = useState<number | "">("");
    const [quantities, setQuantities] = useState<Record<number, string>>({});
    const [isGenerating] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const today = new Date().toLocaleDateString("pt-BR");

    const handleQuantityChange = (index: number, value: string) => {
        setQuantities((prev) => ({ ...prev, [index]: value }));
    };

    const createPDFDoc = (): jsPDF => {
        const doc = new jsPDF();

        const rows = PRODUCTION_ITEMS.map((item, index) => [
            item.description,
            quantities[index] || "0",
            item.unit
        ]);

        doc.setFontSize(16);
        doc.text("Relatório de Produção", 14, 15);

        doc.setFontSize(11);
        doc.text(`Supervisor: ${supervisor}`, 14, 25);
        doc.text(`Data: ${today}`, 14, 32);

        autoTable(doc, {
            startY: 40,
            head: [["Descrição", "Quantidade", "Unidade"]],
            body: rows,
            theme: "grid",
            headStyles: { fillColor: [22, 101, 52] }
        });

        return doc;
    };

    const handleGeneratePDF = () => {
        const doc = createPDFDoc();
        doc.save(`Relatorio_${supervisor}_${today}.pdf`);
    };

    const handleSendEmail = async () => {
        if (!supervisor || !email) return;

        setIsSending(true);

        try {
            const doc = createPDFDoc();
            const pdfBlob = doc.output("blob"); // Blob do PDF

            const formData = new FormData();
            formData.append("Supervisor", supervisor);
            formData.append("Email", email);
            formData.append("File", pdfBlob, `Relatorio_${supervisor}_${today}.pdf`);

            const response = await fetch("https://localhost:7272/api/Email", {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Erro ao enviar e-mail");
            }

            alert("E-mail enviado com sucesso!");
        } catch (err) {
            console.error(err);
            alert("Falha ao enviar e-mail: " + (err as Error).message);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-gradient-to-r from-green-800 to-green-700 text-white py-4 px-4 shadow-lg">
                <div className="max-w-lg mx-auto flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-green-800 font-bold text-lg">JB</span>
                    </div>
                    <div>
                        <p className="text-xs text-green-200 uppercase tracking-wider">Grupo JB</p>
                        <h1 className="text-lg font-bold tracking-tight">Relatório de Produção</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-lg mx-auto p-4 pb-8">
                {/* Info Fields */}
                <section className="bg-card rounded-xl shadow-sm border border-border p-4 mb-4">
                    <div className="space-y-3">
                        {/* Supervisor */}
                        <div className="flex flex-col">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Supervisor
                            </label>
                            <input
                                type="text"
                                placeholder="Digite seu nome"
                                value={supervisor}
                                onChange={(e) => setSupervisor(e.target.value)}
                                className="mt-1 px-3 py-2 bg-muted rounded-md text-foreground font-medium w-full"
                            />
                        </div>

                        {/* Data e Período */}
                        <div className="flex gap-4">
                            {/* Input de Data */}
                            <div className="flex-1 flex flex-col">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Data
                                </label>
                                <input
                                    type="date"
                                    value={data}
                                    onChange={(e) => setData(e.target.value)}
                                    className="mt-1 px-3 py-2 bg-muted rounded-md text-foreground font-medium w-full"
                                />
                            </div>

                            {/* Input de Período */}
                            <div className="w-24 flex flex-col">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">
                                    Período
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    value={periodo}
                                    onChange={(e) => setPeriodo(e.target.value === "" ? "" : parseInt(e.target.value))}
                                    className="mt-1 px-3 py-2 bg-muted rounded-md text-foreground font-medium text-center w-full"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Production Table */}
                <section className="bg-card rounded-xl shadow-sm border border-border overflow-hidden mb-4">
                    <div className="bg-gradient-to-r from-green-700 to-green-600 px-4 py-3">
                        <h2 className="text-white font-semibold text-sm uppercase tracking-wide">
                            Produções Realizadas
                        </h2>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-[1fr_100px_80px] bg-green-50 border-b border-border">
                        <div className="px-3 py-2 text-xs font-semibold text-green-800 uppercase">
                            Descrição
                        </div>
                        <div className="px-2 py-2 text-xs font-semibold text-green-800 uppercase text-center">
                            Quant
                        </div>
                        <div className="px-2 py-2 text-xs font-semibold text-green-800 uppercase text-center">
                            UN
                        </div>
                    </div>

                    {/* Table Rows */}
                    <div className="divide-y divide-border">
                        {PRODUCTION_ITEMS.map((item, index) => (
                            <div
                                key={index}
                                className="grid grid-cols-[1fr_100px_80px] items-center hover:bg-muted/50 transition-colors"
                            >
                                <div className="px-3 py-2.5 text-sm text-foreground">
                                    {item.description}
                                </div>
                                <div className="px-1 py-1.5">
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        placeholder="—"
                                        value={quantities[index] || ""}
                                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                                        className="h-8 text-center text-sm px-1"
                                    />
                                </div>
                                <div className="px-2 py-2.5 text-xs text-muted-foreground text-center font-medium">
                                    {item.unit}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Email Field */}
                <section className="bg-card rounded-xl shadow-sm border border-border p-4 mb-6">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        E-mail para envio
                    </label>
                    <input
                        type="email"
                        placeholder="exemplo@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 ml-6"
                    />
                </section>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleGeneratePDF}
                        disabled={isGenerating || !supervisor}
                        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
                    >
                        {isGenerating ? (
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                            <FileDown className="w-5 h-5 mr-2" />
                        )}
                        Gerar PDF
                    </button>

                    <button
                        onClick={handleSendEmail}
                        disabled={isSending || !supervisor || !email}
                        className="w-full h-12 text-base font-semibold border-2 border-primary text-primary hover:bg-primary hover:text-white"
                    >
                        {isSending ? (
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5 mr-2" />
                        )}
                        Enviar por E-mail
                    </button>
                </div>

                {/* Footer Info */}
                <p className="text-center text-xs text-muted-foreground mt-6">
                    Grupo JB • Sistema de Relatórios de Produção
                </p>
            </main>
        </div>
    );
}