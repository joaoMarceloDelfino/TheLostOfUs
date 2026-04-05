import styles from "./page.module.css";
import ActionCard from "@/app/components/home/ActionCard";
import SightingCard from "@/app/components/home/SightingCard";

const actions = [
  {
    imageSrc: "/images/lost-pet.png",
    imageAlt: "Perdi meu pet",
    title: "PERDI MEU PET –",
    description: "Cadastrar anuncio de desaparecimento",
    backgroundColor: "#ecd789",
  },
  {
    imageSrc: "/images/sighting-pet.png",
    imageAlt: "Avistei um pet",
    title: "AVISTEI UM PET –",
    description: "Reportar animal encontrado na rua",
    backgroundColor: "#5a98eb",
  },
  {
    imageSrc: "/images/alerts.png",
    imageAlt: "Meus alertas",
    title: "MEUS ALERTAS",
    description: "• Gerenciar seus anuncios ativos",
    backgroundColor: "#98ea84",
  },
];

const sightings = [
  {
    imageSrc: "/images/animal-1.png",
    imageAlt: "Animal avistado 1",
    name: "Nome do animal",
    location: "Local Último avistamento: Rua xxx, bairro xxx, Itajaí",
    date: "Data último avistamento: xx/xx/xxxx",
    status: "Status: xxxxxxx",
  },
  {
    imageSrc: "/images/animal-2.png",
    imageAlt: "Animal avistado 2",
    name: "Nome do animal",
    location: "Local Último avistamento: Rua xxx, bairro xxx, Itajaí",
    date: "Data último avistamento: xx/xx/xxxx",
    status: "Status: xxxxxxx",
  },
  {
    imageSrc: "/images/animal-3.png",
    imageAlt: "Animal avistado 3",
    name: "Nome do animal",
    location: "Local Último avistamento: Rua xxx, bairro xxx, Itajaí",
    date: "Data último avistamento: xx/xx/xxxx",
    status: "Status: xxxxxxx",
  },
];

export default function HomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <h1 className={styles.title}>Painel Geral: Ajude a Encontrar um Amigo!</h1>

        <section className={styles.actionsSection}>
          {actions.map((action) => (
            <ActionCard
              key={action.title}
              imageSrc={action.imageSrc}
              imageAlt={action.imageAlt}
              title={action.title}
              description={action.description}
              backgroundColor={action.backgroundColor}
            />
          ))}
        </section>

        <section className={styles.sightingsSection}>
          <h2 className={styles.sectionTitle}>Ultimos Avistamentos</h2>

          <div className={styles.sightingsGrid}>
            {sightings.map((sighting, index) => (
              <SightingCard
                key={index}
                imageSrc={sighting.imageSrc}
                imageAlt={sighting.imageAlt}
                name={sighting.name}
                location={sighting.location}
                date={sighting.date}
                status={sighting.status}
              />
            ))}
          </div>
        </section>

        <div className={styles.arrowWrapper}>
          <span className={styles.arrow}>⌄</span>
        </div>
      </section>
    </main>
  );
}