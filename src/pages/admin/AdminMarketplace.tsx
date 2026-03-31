import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Trash2, Edit, Save, Star, MapPin, Store } from "lucide-react";
import { Package, fetchMarketplaceItems, createMarketplaceItem, updateMarketplaceItem, deleteMarketplaceItem } from "@/lib/marketplaceService";
import { toast } from "@/hooks/use-toast";

// Create / Edit Modal
const ProductModal = ({
  pkg,
  onClose,
  onSave
}: {
  pkg?: Package;
  onClose: () => void;
  onSave: (pkg: Partial<Package>) => Promise<boolean>;
}) => {
  const {
    t
  } = useTranslation();
  const [form, setForm] = useState<Partial<Package>>(pkg || {
    title: "",
    host: "Admin",
    destination: "",
    category: "tour",
    price: 0,
    duration: t("auto.z_autoz1일695_1051"),
    maxPeople: 10,
    currentPeople: 0,
    image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80",
    description: "",
    tags: [],
    featured: false
  });
  const [saving, setSaving] = useState(false);
  const handleSubmit = async () => {
    if (!form.title || !form.price || !form.destination) {
      toast({
        title: t("alert.t11Title"),
        variant: "destructive"
      });
      return;
    }
    setSaving(true);
    const success = await onSave(form);
    setSaving(false);
    if (success) {
      onClose();
    }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div className="relative z-10 w-full max-w-lg bg-card rounded-3xl p-6 shadow-float max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-extrabold text-foreground">{pkg ? t("auto.z_autoz상품수정6_1052") : t("auto.z_autoz새상품등록_1053")}</h2>
          <button onClick={onClose} className="p-2 bg-muted rounded-full"><X size={18} /></button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">{t("auto.z_autoz상품명69_1054")}</label>
            <input value={form.title} onChange={e => setForm({
            ...form,
            title: e.target.value
          })} className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none" placeholder={t("auto.z_autoz예오사카먹_1055")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">{t("auto.z_autoz카테고리7_1056")}</label>
              <select value={form.category} onChange={e => setForm({
              ...form,
              category: e.target.value
            })} className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none">
                <option value="tour">{t("auto.z_autoz투어701_1057")}</option>
                <option value="activity">{t("auto.z_autoz액티비티7_1058")}</option>
                <option value="stay">{t("auto.z_autoz숙소703_1059")}</option>
                <option value="food">{t("auto.z_autoz맛집704_1060")}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">{t("auto.z_autoz가격원70_1061")}</label>
              <input type="number" value={form.price} onChange={e => setForm({
              ...form,
              price: Number(e.target.value)
            })} className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">{t("auto.z_autoz목적지70_1062")}</label>
              <input value={form.destination} onChange={e => setForm({
              ...form,
              destination: e.target.value
            })} className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none" placeholder={t("auto.z_autoz예오사카일_1063")} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">{t("auto.z_autoz소요시간기_1064")}</label>
              <input value={form.duration} onChange={e => setForm({
              ...form,
              duration: e.target.value
            })} className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none" placeholder={t("auto.z_autoz예4시간또_1065")} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">{t("auto.z_autoz상세설명7_1066")}</label>
            <textarea value={form.description} onChange={e => setForm({
            ...form,
            description: e.target.value
          })} rows={3} className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none resize-none"></textarea>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">{t("auto.z_autoz대표이미지_1067")}</label>
            <input value={form.image} onChange={e => setForm({
            ...form,
            image: e.target.value
          })} className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none" />
            {form.image && <img src={form.image} alt="preview" className="mt-2 w-full h-32 object-cover rounded-xl" />}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="featured" checked={form.featured} onChange={e => setForm({
            ...form,
            featured: e.target.checked
          })} className="w-4 h-4 accent-primary" />
            <label htmlFor="featured" className="text-sm font-semibold text-foreground">{t("auto.z_autoz인기Fea_1068")}</label>
          </div>

        </div>

        <button onClick={handleSubmit} disabled={saving} className="w-full mt-6 py-4 bg-primary text-primary-foreground font-bold rounded-xl flex justify-center items-center gap-2">
          {saving ? t("auto.z_autoz저장중71_1069") : <><Save size={18} />{t("auto.z_autoz저장하기7_1070")}</>}
        </button>
      </motion.div>
    </div>;
};
const AdminMarketplace = () => {
  const {
    t
  } = useTranslation();
  const [items, setItems] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Package | null>(null);
  const loadData = async () => {
    setLoading(true);
    const data = await fetchMarketplaceItems();
    setItems(data);
    setLoading(false);
  };
  useEffect(() => {
    loadData();
  }, []);
  const handleSave = async (pkgData: Partial<Package>) => {
    if (editingItem) {
      const success = await updateMarketplaceItem(editingItem.id, pkgData);
      if (success) {
        toast({
          title: t("alert.t12Title")
        });
        loadData();
        return true;
      }
      toast({
        title: t("alert.t13Title"),
        variant: "destructive"
      });
      return false;
    } else {
      const success = await createMarketplaceItem(pkgData as Package);
      if (success) {
        toast({
          title: t("alert.t14Title")
        });
        loadData();
        return true;
      }
      toast({
        title: t("alert.t15Title"),
        variant: "destructive"
      });
      return false;
    }
  };
  const handleDelete = async (id: string, title: string) => {
    if (confirm(i18n.t("admin.confirmDeleteItem", {
      title,
      defaultValue: `Delete '${title}'? This cannot be undone.`
    }))) {
      const success = await deleteMarketplaceItem(id);
      if (success) {
        toast({
          title: t("alert.t16Title")
        });
        loadData();
      } else toast({
        title: t("alert.t17Title"),
        variant: "destructive"
      });
    }
  };
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Store size={24} className="text-primary" />{t("auto.z_autoz마켓상품관_1072")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("auto.z_autoz투어액티비_1073")}</p>
        </div>
        <button onClick={() => {
        setEditingItem(null);
        setShowModal(true);
      }} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center gap-2">
          <Plus size={16} />{t("auto.z_autoz새상품등록_1074")}</button>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {loading ? <div className="p-12 text-center text-muted-foreground text-sm font-semibold">{t("auto.z_autoz상품목록을_1075")}</div> : items.length === 0 ? <div className="p-12 text-center text-muted-foreground text-sm font-semibold">{t("auto.z_autoz등록된상품_1076")}</div> : <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="p-4 text-xs font-bold text-muted-foreground w-16">{t("auto.z_autoz이미지72_1077")}</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground">{t("auto.z_autoz상품명72_1078")}</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground">{t("auto.z_autoz카테고리7_1079")}</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground">{t("auto.z_autoz목적지72_1080")}</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground text-right">{t("auto.z_autoz가격725_1081")}</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground text-right w-24">{t("auto.z_autoz관리726_1082")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map(item => <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover bg-muted" />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{item.title}</span>
                        {item.featured && <Star size={12} className="text-amber-500 fill-amber-500" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{item.description.substring(0, 50)}...</p>
                    </td>
                    <td className="p-4 text-xs font-semibold text-muted-foreground">
                      {item.category === "tour" ? i18n.t("auto.z_autoz투어727_1083") : item.category === "stay" ? i18n.t("auto.z_autoz숙소728_1084") : item.category === "activity" ? i18n.t("auto.z_autoz액티비티7_1085") : i18n.t("auto.z_autoz맛집730_1086")}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground flex items-center gap-1 mt-3.5">
                      <MapPin size={12} /> {item.destination}
                    </td>
                    <td className="p-4 text-sm font-bold text-foreground text-right">
                      {item.price.toLocaleString()}{i18n.t("auto.z_autoz원731_1087")}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => {
                    setEditingItem(item);
                    setShowModal(true);
                  }} className="p-2 bg-muted text-muted-foreground rounded-lg hover:text-primary transition-colors">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDelete(item.id, item.title)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>}
      </div>

      <AnimatePresence>
        {showModal && <ProductModal pkg={editingItem || undefined} onClose={() => setShowModal(false)} onSave={handleSave} />}
      </AnimatePresence>
    </div>;
};
export default AdminMarketplace;